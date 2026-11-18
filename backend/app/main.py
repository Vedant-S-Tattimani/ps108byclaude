"""SpecSetu API - Indian Standards recommendation engine for procurement specifications."""
from __future__ import annotations

import logging
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from starlette.concurrency import run_in_threadpool

from .config import settings
from .schemas import AuditRequest, BatchRequest, FeedbackRequest, RecommendRequest, fail, ok
from .services.certificates import check_certificate
from .services.extractor import ExtractionError, extract_text, split_items
from .services.ratelimit import RateLimiter
from .services.recommender import Services

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("specsetu")
STATIC_DIR = Path(__file__).parent / "static"


def create_app(services: Services | None = None) -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        description="Recommends applicable Indian Standards, allied standards and mandatory certification for procurement specifications.",
    )
    app.state.services = services or Services.build(settings.standards_path, settings.lexicon_path, settings.feedback_path)
    app.state.limiter = RateLimiter(settings.rate_limit_per_minute)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    @app.middleware("http")
    async def rate_limit(request: Request, call_next):
        if request.url.path.startswith("/api/") and request.method == "POST":
            client = request.client.host if request.client else "anonymous"
            if not request.app.state.limiter.allow(client):
                return JSONResponse(fail("Too many requests. Please wait a minute and try again."), status_code=429)
        return await call_next(request)

    @app.exception_handler(RequestValidationError)
    async def validation_error(_request: Request, exc: RequestValidationError):
        message = "; ".join(str(e.get("msg", "Invalid input")).removeprefix("Value error, ") for e in exc.errors())
        return JSONResponse(fail(message), status_code=422)

    @app.exception_handler(HTTPException)
    async def http_error(_request: Request, exc: HTTPException):
        return JSONResponse(fail(str(exc.detail)), status_code=exc.status_code)

    @app.exception_handler(Exception)
    async def unexpected_error(_request: Request, exc: Exception):
        logger.exception("Unhandled error: %s", exc)
        return JSONResponse(fail("Something went wrong on our side. Please try again."), status_code=500)

    _register_routes(app)
    return app


def get_services(request: Request) -> Services:
    return request.app.state.services


def _register_routes(app: FastAPI) -> None:
    @app.get("/api/health")
    async def health(svc: Services = Depends(get_services)):
        return ok({
            "status": "ok",
            "standards": len(svc.repo.all()),
            "llm_enabled": svc.reranker.enabled,
            "llm_provider": svc.reranker.provider if svc.reranker.enabled else None,
            "llm_model": svc.reranker.model or None,
            "version": settings.version,
        })

    @app.post("/api/recommend")
    async def recommend(body: RecommendRequest, svc: Services = Depends(get_services)):
        data = await run_in_threadpool(svc.recommend, body.query, body.top_k, body.language)
        return ok(data)

    @app.post("/api/recommend/upload")
    async def recommend_upload(file: UploadFile = File(...), svc: Services = Depends(get_services)):
        payload = await file.read(settings.max_upload_bytes + 1)
        if len(payload) > settings.max_upload_bytes:
            raise HTTPException(413, f"File is larger than {settings.max_upload_bytes // (1024 * 1024)} MB.")
        try:
            text = await run_in_threadpool(extract_text, file.filename or "upload.txt", payload)
        except ExtractionError as exc:
            raise HTTPException(400, str(exc)) from exc
        text = text[: settings.max_query_chars].strip()
        if len(text) < 10:
            raise HTTPException(400, "The document has too little text to analyse.")
        recommendation = await run_in_threadpool(svc.recommend, text, 5, None)
        audit_report = await run_in_threadpool(svc.audit, text)
        items = await run_in_threadpool(svc.recommend_items, split_items(text))
        return ok({
            "filename": file.filename,
            "characters": len(text),
            "excerpt": text[:600],
            "recommendation": recommendation,
            "audit": audit_report,
            "items": items,
        })

    @app.post("/api/recommend/batch")
    async def recommend_batch(body: BatchRequest, svc: Services = Depends(get_services)):
        rows = await run_in_threadpool(svc.recommend_items, body.items)
        return ok(rows, {"total": len(rows)})

    @app.post("/api/audit")
    async def audit_spec(body: AuditRequest, svc: Services = Depends(get_services)):
        return ok(await run_in_threadpool(svc.audit, body.text))

    @app.get("/api/standards")
    async def list_standards(
        q: str = Query("", max_length=100),
        category: str = Query("", max_length=80),
        certification: str = Query("", max_length=20),
        svc: Services = Depends(get_services),
    ):
        items = [s.summary() for s in svc.repo.search(q, category, certification)]
        return ok(items, {"total": len(items)})

    @app.get("/api/standards/{standard_id}")
    async def standard_detail(standard_id: str, svc: Services = Depends(get_services)):
        standard = svc.repo.find_by_id(standard_id)
        if not standard:
            raise HTTPException(404, "Standard not found.")
        referenced_by = []
        for ref in svc.repo.referenced_by(standard_id):
            source = svc.repo.find_by_id(ref["id"])
            if source:
                referenced_by.append({**source.summary(), "relation": ref["type"]})
        return ok({
            **standard.summary(),
            "relations": svc.repo.relations_of(standard_id),
            "referenced_by": referenced_by,
        })

    @app.get("/api/updates")
    async def updates(since: int = Query(2015, ge=1950, le=2100), svc: Services = Depends(get_services)):
        rows = svc.repo.updates_since(since)
        return ok(rows, {"total": len(rows), "since": since})

    @app.post("/api/feedback")
    async def feedback(body: FeedbackRequest, svc: Services = Depends(get_services)):
        if not svc.repo.find_by_id(body.standard_id):
            raise HTTPException(404, "Standard not found.")
        record = await run_in_threadpool(svc.feedback.add, body.query, body.standard_id, body.helpful, body.comment)
        return ok(record)

    @app.get("/api/feedback/summary")
    async def feedback_summary(svc: Services = Depends(get_services)):
        return ok(await run_in_threadpool(svc.feedback.summary))

    @app.get("/api/certificate/check")
    async def certificate_check(number: str = Query(..., min_length=3, max_length=40)):
        return ok(check_certificate(number))

    @app.get("/widget.js", include_in_schema=False)
    async def widget_script():
        return FileResponse(STATIC_DIR / "widget.js", media_type="application/javascript")

    @app.get("/widget-demo", include_in_schema=False)
    async def widget_demo():
        return FileResponse(STATIC_DIR / "widget-demo.html", media_type="text/html")

    @app.get("/api/categories")
    async def categories(svc: Services = Depends(get_services)):
        return ok(svc.repo.categories())

    @app.get("/api/stats")
    async def stats(svc: Services = Depends(get_services)):
        items = svc.repo.all()
        schemes: dict[str, int] = {}
        for s in items:
            cert = s.raw["certification"]
            if cert["mandatory"]:
                schemes[cert["scheme"]] = schemes.get(cert["scheme"], 0) + 1
        return ok({
            "standards": len(items),
            "categories": len(svc.repo.categories()),
            "relations": sum(len(s.raw["relations"]) for s in items),
            "mandatory_by_scheme": schemes,
        })


app = create_app()
