"""Read-only access to the Indian Standards knowledge base (repository pattern)."""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

RELATION_LABELS = {
    "normative": "Normative references",
    "test_method": "Test methods",
    "terminology": "Terminology",
    "safety": "Safety standards",
    "installation": "Installation & codes of practice",
    "related_product": "Related product standards",
    "sampling": "Sampling & inspection",
}

KNOW_YOUR_STANDARD_URL = "https://www.bis.gov.in/know-your-standard/"

_KIND_RULES = (
    ("terminology", re.compile(r"vocabulary|glossary|terminology", re.I)),
    ("sampling", re.compile(r"sampling", re.I)),
    ("test_method", re.compile(r"method(s)? of (test|chemical|electrical)|tests?$|testing|assaying|methods of tests", re.I)),
    ("code_of_practice", re.compile(r"code of practice", re.I)),
)

_REF_PATTERN = re.compile(
    r"IS\s*(?:/\s*IEC\s*)?[:\s-]*(\d{2,5})(?:\s*-\s*(\d+))?"
    r"(?:\s*\(\s*Part\s*(\d+)(?:\s*/\s*Sec(?:tion)?\s*(\d+))?[^)]*\))?",
    re.I,
)


def reference_key(text: str) -> Optional[str]:
    """Normalise 'IS 1554 (Part 1)', 'IS/IEC 60898-1' etc. to a lookup key like '1554-1'."""
    match = _REF_PATTERN.search(text)
    if not match:
        return None
    number, dash_part, part, section = match.groups()
    pieces = [number]
    if dash_part:
        pieces.append(dash_part)
    if part:
        pieces.append(part)
    if section:
        pieces.append(section)
    return "-".join(pieces)


def classify_kind(title: str) -> str:
    for kind, pattern in _KIND_RULES:
        if pattern.search(title):
            return kind
    return "product"


@dataclass(frozen=True)
class Standard:
    raw: dict

    @property
    def id(self) -> str:
        return self.raw["id"]

    @property
    def designation(self) -> str:
        return f"{self.raw['number']}:{self.raw['year']}"

    @property
    def kind(self) -> str:
        return classify_kind(self.raw["title"])

    def search_text(self) -> str:
        r = self.raw
        return " ".join(
            [r["number"], r["title"], r["title"], r["scope"], r["category"], " ".join(r["keywords"]) * 2]
        )

    def summary(self) -> dict:
        r = self.raw
        latest_amendment = r["amendments"][-1] if r["amendments"] else None
        return {
            "id": r["id"],
            "number": r["number"],
            "year": r["year"],
            "designation": self.designation,
            "title": r["title"],
            "scope": r["scope"],
            "category": r["category"],
            "ics": r["ics"],
            "status": r["status"],
            "kind": self.kind,
            "amendments": r["amendments"],
            "latest_amendment": latest_amendment,
            "previous_versions": r["previous_versions"],
            "certification": r["certification"],
            "keywords": r["keywords"],
            "official_url": KNOW_YOUR_STANDARD_URL,
        }


class StandardsRepository:
    def __init__(self, records: Iterable[dict]):
        self._items = tuple(Standard(r) for r in records)
        self._by_id = {s.id: s for s in self._items}
        self._by_key = {}
        for s in self._items:
            key = reference_key(s.raw["number"])
            if key:
                self._by_key[key] = s
        self._referenced_by = self._build_reverse_index()

    @classmethod
    def from_file(cls, path: Path) -> "StandardsRepository":
        with path.open(encoding="utf-8") as fh:
            payload = json.load(fh)
        return cls(payload["standards"])

    def _build_reverse_index(self) -> dict:
        reverse: dict[str, list[dict]] = {}
        for s in self._items:
            for rel in s.raw["relations"]:
                reverse.setdefault(rel["id"], []).append({"id": s.id, "type": rel["type"]})
        return reverse

    def all(self) -> tuple[Standard, ...]:
        return self._items

    def find_by_id(self, standard_id: str) -> Optional[Standard]:
        return self._by_id.get(standard_id)

    def find_by_reference(self, text: str) -> Optional[Standard]:
        key = reference_key(text)
        return self._by_key.get(key) if key else None

    def referenced_by(self, standard_id: str) -> list[dict]:
        return list(self._referenced_by.get(standard_id, []))

    def relations_of(self, standard_id: str) -> list[dict]:
        standard = self.find_by_id(standard_id)
        if not standard:
            return []
        out = []
        for rel in standard.raw["relations"]:
            target = self.find_by_id(rel["id"])
            if target:
                out.append({**target.summary(), "relation": rel["type"]})
        return out

    def updates_since(self, year: int) -> list[dict]:
        """Standards revised or amended in or after `year`, most recent change first."""
        rows = []
        for s in self._items:
            r = s.raw
            last_amendment = r["amendments"][-1] if r["amendments"] else None
            events = []
            if r["year"] >= year and r["previous_versions"]:
                events.append({"year": r["year"], "change": f"Revised (replaces {r['number']}:{max(r['previous_versions'])})"})
            elif r["year"] >= year:
                events.append({"year": r["year"], "change": "Published"})
            for a in r["amendments"]:
                if a["year"] >= year:
                    events.append({"year": a["year"], "change": f"Amendment No. {a['no']}"})
            if events:
                latest = max(events, key=lambda e: e["year"])
                rows.append({**s.summary(), "changes": sorted(events, key=lambda e: e["year"], reverse=True), "last_changed": latest["year"], "last_amendment": last_amendment})
        return sorted(rows, key=lambda x: x["last_changed"], reverse=True)

    def categories(self) -> list[dict]:
        counts: dict[str, int] = {}
        for s in self._items:
            counts[s.raw["category"]] = counts.get(s.raw["category"], 0) + 1
        return [{"name": k, "count": v} for k, v in sorted(counts.items())]

    def search(self, text: str = "", category: str = "", certification: str = "") -> list[Standard]:
        needle = text.lower().strip()
        results = []
        for s in self._items:
            if category and s.raw["category"] != category:
                continue
            if certification and s.raw["certification"]["scheme"] != certification:
                continue
            if needle and needle not in s.search_text().lower():
                continue
            results.append(s)
        return results
