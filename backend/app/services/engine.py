"""Hybrid semantic retrieval over the Indian Standards knowledge base.

Scoring blends four signals so that a description like "geyser for hostel bathrooms"
reaches IS 2082 even when the words differ from the standard's title:

* word TF-IDF (1-2 grams) on a concept-expanded query,
* latent semantic analysis (TruncatedSVD over TF-IDF) for co-occurrence meaning,
* character n-grams for spelling variants and typos ("cabel", "galvanised"),
* a domain concept graph that maps everyday procurement words to standard concepts.
"""
from __future__ import annotations

import math
import re
from dataclasses import dataclass

import numpy as np
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize

from .repository import RELATION_LABELS, Standard, StandardsRepository

WEIGHTS = {"word": 0.38, "lsa": 0.17, "char": 0.15, "concept": 0.30}
KEYWORD_BONUS = 0.06
MAX_KEYWORD_BONUS = 0.24
SUPPORTING_PENALTY = 0.55
MIN_CONFIDENT_SCORE = 0.12
MIN_SHOWN_CONFIDENCE = 15
SUPPORT_INTENT = re.compile(r"\b(test|testing|method|installation|install|laying|code of practice|sampling|vocabulary|assay)\b", re.I)


@dataclass(frozen=True)
class Match:
    standard: Standard
    score: float
    signals: dict
    matched_terms: tuple[str, ...]
    concepts: tuple[str, ...]


def _word_in(term: str, text: str) -> bool:
    """Whole-word match that also accepts simple English plurals (helmet -> helmets)."""
    return re.search(rf"(?<![a-z0-9]){re.escape(term)}(?:s|es)?(?![a-z0-9])", text) is not None


def confidence(score: float, top_score: float | None = None) -> int:
    """Map a blended score onto 0-99: logistic on the absolute score, damped by distance from the best match."""
    absolute = 99 / (1 + math.exp(-11 * (score - 0.2)))
    relative = (score / top_score) ** 0.7 if top_score and top_score > 0 else 1.0
    return int(round(absolute * min(1.0, relative)))


class RecommendationEngine:
    def __init__(self, repo: StandardsRepository, concepts: dict[str, list[str]]):
        self.repo = repo
        self.concepts = {k: tuple(s.lower() for s in v) for k, v in concepts.items()}
        self._standards = repo.all()
        docs = [s.search_text().lower() for s in self._standards]
        self._docs = docs

        self._word = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, stop_words="english")
        word_matrix = self._word.fit_transform(docs)
        self._word_matrix = word_matrix

        self._char = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True)
        self._char_matrix = self._char.fit_transform(docs)

        components = max(2, min(60, len(docs) - 1))
        self._svd = TruncatedSVD(n_components=components, random_state=42)
        self._lsa_matrix = normalize(self._svd.fit_transform(word_matrix))

        self._doc_concepts = [self._concept_strengths(doc) for doc in docs]

    # ---- concept graph -------------------------------------------------
    def _concept_strengths(self, text: str) -> dict[str, float]:
        """How strongly a document expresses each concept: share of the concept's terms it uses (cap 3)."""
        strengths = {}
        for concept, synonyms in self.concepts.items():
            terms = {concept, *synonyms}
            hits = sum(1 for t in terms if _word_in(t, text))
            if hits:
                strengths[concept] = min(1.0, hits / min(3, len(terms)))
        return strengths

    def _concepts_in(self, text: str) -> frozenset[str]:
        hits = set()
        for concept, synonyms in self.concepts.items():
            if _word_in(concept, text) or any(_word_in(s, text) for s in synonyms):
                hits.add(concept)
        return frozenset(hits)

    def expand(self, query: str) -> tuple[str, tuple[str, ...]]:
        lowered = query.lower()
        found = self._concepts_in(lowered)
        extra = []
        for concept in sorted(found):
            extra.append(concept)
            extra.extend(self.concepts[concept][:4])
        return f"{lowered} {' '.join(extra)}".strip(), tuple(sorted(found))

    # ---- scoring -------------------------------------------------------
    def score(self, query: str) -> list[Match]:
        expanded, query_concepts = self.expand(query)
        lowered = query.lower()

        q_word = self._word.transform([expanded])
        word_sim = (self._word_matrix @ q_word.T).toarray().ravel()
        q_char = self._char.transform([lowered])
        char_sim = (self._char_matrix @ q_char.T).toarray().ravel()
        q_lsa = normalize(self._svd.transform(q_word))
        lsa_sim = np.clip(self._lsa_matrix @ q_lsa.T, 0, None).ravel()

        wants_support = bool(SUPPORT_INTENT.search(lowered))
        matches = []
        for i, standard in enumerate(self._standards):
            doc_concepts = self._doc_concepts[i]
            shared = tuple(sorted(c for c in query_concepts if c in doc_concepts))
            concept_sim = (
                sum(doc_concepts[c] for c in shared) / len(query_concepts) if query_concepts else 0.0
            )

            keywords = [k for k in standard.raw["keywords"] if _word_in(k.lower(), lowered)]
            bonus = min(MAX_KEYWORD_BONUS, KEYWORD_BONUS * len(keywords))

            blended = (
                WEIGHTS["word"] * word_sim[i]
                + WEIGHTS["lsa"] * lsa_sim[i]
                + WEIGHTS["char"] * char_sim[i]
                + WEIGHTS["concept"] * concept_sim
                + bonus
            )
            if standard.kind != "product" and not wants_support:
                blended *= SUPPORTING_PENALTY
            signals = {
                "lexical": round(float(word_sim[i]), 3),
                "semantic": round(float(lsa_sim[i]), 3),
                "fuzzy": round(float(char_sim[i]), 3),
                "concept": round(float(concept_sim), 3),
                "keyword_bonus": round(bonus, 3),
            }
            matches.append(Match(standard, float(blended), signals, tuple(keywords), shared))
        return sorted(matches, key=lambda m: m.score, reverse=True)

    # ---- result assembly ----------------------------------------------
    def recommend(self, query: str, top_k: int = 5) -> dict:
        ranked = self.score(query)
        top = [m for m in ranked[:top_k] if m.score >= MIN_CONFIDENT_SCORE * 0.6] or ranked[:1]
        _expanded, concepts = self.expand(query)
        rendered = [self._render(m, rank + 1, top[0].score) for rank, m in enumerate(top)]
        recommendations = rendered[:1] + [r for r in rendered[1:] if r["confidence"] >= MIN_SHOWN_CONFIDENCE]
        primary_ids = [m.standard.id for m in top[:3]]
        return {
            "recommendations": recommendations,
            "allied": self.allied(primary_ids),
            "certifications": self.certifications([m.standard for m in top[:3]]),
            "concepts_detected": list(concepts),
            "low_confidence": top[0].score < MIN_CONFIDENT_SCORE,
        }

    def _render(self, match: Match, rank: int, top_score: float) -> dict:
        s = match.standard
        reasons = []
        if match.concepts:
            reasons.append("Matches procurement concept(s): " + ", ".join(match.concepts))
        if match.matched_terms:
            reasons.append("Key terms found in your description: " + ", ".join(match.matched_terms[:5]))
        if match.signals["semantic"] > 0.35:
            reasons.append("Scope is semantically close to your description")
        if not reasons:
            reasons.append("Closest available scope in the knowledge base")
        return {
            **s.summary(),
            "rank": rank,
            "score": round(match.score, 4),
            "confidence": confidence(match.score, top_score),
            "signals": match.signals,
            "reasons": reasons,
        }

    def allied(self, primary_ids: list[str]) -> list[dict]:
        groups: dict[str, dict] = {}
        seen: set[str] = set(primary_ids)
        for pid in primary_ids:
            source = self.repo.find_by_id(pid)
            for rel in self.repo.relations_of(pid):
                if rel["id"] in seen:
                    continue
                seen.add(rel["id"])
                kind = rel["relation"]
                group = groups.setdefault(kind, {"type": kind, "label": RELATION_LABELS[kind], "items": []})
                group["items"].append({**rel, "via": source.designation if source else pid})
        sampling = [s for s in ("is-4905", "is-2500-1") if s not in seen]
        for sid in sampling:
            standard = self.repo.find_by_id(sid)
            if standard:
                group = groups.setdefault("sampling", {"type": "sampling", "label": RELATION_LABELS["sampling"], "items": []})
                group["items"].append({**standard.summary(), "relation": "sampling", "via": "General acceptance inspection"})
        order = list(RELATION_LABELS)
        return sorted(groups.values(), key=lambda g: order.index(g["type"]))

    @staticmethod
    def certifications(standards: list[Standard]) -> list[dict]:
        notes = {
            "ISI": "Product must carry the ISI (Standard) Mark under a valid BIS licence (Scheme-I). Ask bidders for the licence number (CM/L-xxxxxxx) and verify it on the BIS portal.",
            "CRS": "Product must be registered with BIS under the Compulsory Registration Scheme (Scheme-II) and display the Standard Mark with the R-number.",
            "Hallmarking": "Articles must be hallmarked by a BIS-recognised Assaying & Hallmarking Centre with a 6-digit HUID.",
        }
        out = []
        for s in standards:
            cert = s.raw["certification"]
            if cert["scheme"] == "None":
                continue
            out.append({
                "standard": s.designation,
                "standard_id": s.id,
                "scheme": cert["scheme"],
                "mandatory": cert["mandatory"],
                "instrument": cert["instrument"],
                "guidance": notes.get(cert["scheme"], "") if cert["mandatory"] else "Voluntary certification available - may be required in the tender to raise quality assurance.",
            })
        return out
