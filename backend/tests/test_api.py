import io

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(create_app())


def test_health(client):
    body = client.get("/api/health").json()
    assert body["success"] is True
    assert body["data"]["standards"] > 50


def test_recommend_envelope(client):
    body = client.post("/api/recommend", json={"query": "LED street light 90W", "top_k": 3}).json()
    assert body["success"] is True
    assert body["error"] is None
    assert body["data"]["recommendations"][0]["id"] == "is-10322-5-3"
    assert body["data"]["clause"].startswith("TECHNICAL SPECIFICATION")


def test_recommend_validates_input(client):
    response = client.post("/api/recommend", json={"query": " "})
    assert response.status_code == 422
    assert response.json()["success"] is False


def test_recommend_rejects_oversized_query(client):
    response = client.post("/api/recommend", json={"query": "x" * 30000})
    assert response.status_code == 422


def test_audit_endpoint(client):
    body = client.post("/api/audit", json={"text": "Helmets as per IS 4151:1993 for riders"}).json()
    assert body["success"] is True
    assert any(f["type"] == "outdated" for f in body["data"]["findings"])


def test_upload_text_document(client):
    doc = b"Tender for supply of OPC 53 grade cement for construction of school building."
    response = client.post("/api/recommend/upload", files={"file": ("tender.txt", io.BytesIO(doc), "text/plain")})
    body = response.json()
    assert response.status_code == 200, body
    assert body["data"]["recommendation"]["recommendations"][0]["id"] == "is-269"
    assert "findings" in body["data"]["audit"]


def test_upload_rejects_unknown_type(client):
    response = client.post("/api/recommend/upload", files={"file": ("tender.exe", io.BytesIO(b"MZ..."), "application/octet-stream")})
    assert response.status_code == 400
    assert response.json()["success"] is False


def test_standards_listing_and_filters(client):
    body = client.get("/api/standards", params={"certification": "CRS"}).json()
    assert body["meta"]["total"] > 3
    assert all(s["certification"]["scheme"] == "CRS" for s in body["data"])


def test_standard_detail_with_graph(client):
    body = client.get("/api/standards/is-10810").json()
    assert body["data"]["number"] == "IS 10810 (series)"
    assert len(body["data"]["referenced_by"]) >= 3


def test_standard_not_found(client):
    response = client.get("/api/standards/does-not-exist")
    assert response.status_code == 404


def test_rate_limit(monkeypatch):
    app = create_app()
    app.state.limiter.limit = 2
    limited = TestClient(app)
    codes = [limited.post("/api/audit", json={"text": "cement as per IS 269"}).status_code for _ in range(3)]
    assert codes[-1] == 429
