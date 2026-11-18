"""Orchestrates one recommendation: language -> retrieval -> optional Nemotron -> checklist -> clause."""
from __future__ import annotations

import json
import time
from dataclasses import dataclass
from pathlib import Path

from .auditor import audit
from .clause import draft_clause
from .engine import RecommendationEngine, confidence
from .extractor import detect_parameters
from .feedback import FeedbackStore
from .language import translate
from .llm import NemotronReranker
from .parameters import check_parameters
from .repository import StandardsRepository


@dataclass(frozen=True)
class Services:
    repo: StandardsRepository
    engine: RecommendationEngine
    glossaries: dict
    reranker: NemotronReranker
    feedback: FeedbackStore

    @classmethod
    def build(
        cls,
        standards_path: Path,
        lexicon_path: Path,
        feedback_path: Path | None = None,
        reranker: NemotronReranker | None = None,
    ) -> "Services":
        repo = StandardsRepository.from_file(standards_path)
        with lexicon_path.open(encoding="utf-8") as fh:
            lexicon = json.load(fh)
        engine = RecommendationEngine(repo, lexicon["concepts"])
        store = FeedbackStore(feedback_path or standards_path.parent / "runtime" / "feedback.jsonl")
        return cls(repo, engine, lexicon["glossary"], reranker or NemotronReranker(), store)

    def recommend(self, query: str, top_k: int = 5, language: str | None = None) -> dict:
        started = time.perf_counter()
        lang = translate(query, self.glossaries, language)
        english = lang.translated or query
        engine_name = "Hybrid semantic engine (TF-IDF + LSA + concept graph)"
        translated_by_llm = False
        if self.reranker.enabled and lang.code != "en" and lang.untranslated:
            llm_english = self.reranker.translate(query)  # glossary missed words: let Nemotron translate first
            if llm_english:
                english, translated_by_llm = llm_english, True
        result = self.engine.recommend(english, top_k=max(top_k, 8))

        llm = self.reranker.rerank(query, result["recommendations"]) if self.reranker.enabled else None
        if llm:
            engine_name += f" + {self.reranker.provider} re-ranking"
            if not translated_by_llm:
                english = llm.get("english_query") or english
            result = {**result, "recommendations": self._apply_llm(result["recommendations"], llm["ranking"])}

        result = {**result, "recommendations": result["recommendations"][:top_k]}
        checklist = check_parameters(result["recommendations"][0]["category"], f"{query} {english}") if result["recommendations"] else None
        return {
            **result,
            "query": query,
            "language": {
                "code": lang.code,
                "name": lang.name,
                "english_query": english,
                "glossary_hits": list(lang.glossary_hits),
                "untranslated": [] if translated_by_llm else list(lang.untranslated),
                "translated_by_llm": translated_by_llm,
            },
            "parameters": detect_parameters(query),
            "spec_checklist": checklist,
            "clause": draft_clause(english, result, checklist),
            "engine": engine_name,
            "elapsed_ms": round((time.perf_counter() - started) * 1000, 1),
        }

    @staticmethod
    def _apply_llm(recs: list[dict], ranking: list[dict]) -> list[dict]:
        by_id = {r["id"]: r for r in recs}
        ordered = []
        ceiling = 99
        for position, item in enumerate(ranking):
            rec = by_id.pop(item["id"])
            boosted = min(ceiling, max(rec["confidence"], confidence(0.5 - position * 0.06)))
            ceiling = max(boosted - 1, 1)  # keep confidence strictly decreasing down the re-ranked list
            ordered.append({**rec, "confidence": boosted, "reasons": [item["reason"], *rec["reasons"]]})
        rest_cap = min(40, ceiling)
        rest = [{**r, "confidence": min(r["confidence"], rest_cap)} for r in by_id.values()]
        return [{**r, "rank": i + 1} for i, r in enumerate(ordered + rest)]

    def recommend_items(self, items: list[str]) -> list[dict]:
        """Line-item view for a tender or BOQ: the best standard and certification for each item."""
        rows = []
        for text in items:
            lang = translate(text, self.glossaries)
            result = self.engine.recommend(lang.translated or text, top_k=3)
            top = result["recommendations"][0]
            rows.append({
                "item": text,
                "matched": not result["low_confidence"],
                "standard": {k: top[k] for k in ("id", "designation", "title", "confidence", "certification", "latest_amendment")},
                "alternatives": [r["designation"] for r in result["recommendations"][1:3]],
            })
        return rows

    def audit(self, text: str) -> dict:
        lang = translate(text, self.glossaries)
        return audit(lang.translated or text, self.repo, self.engine)
