"""Specification health check: finds outdated, undated, unknown and missing standard references."""
from __future__ import annotations

import re

from .engine import RecommendationEngine
from .repository import StandardsRepository

CITATION = re.compile(
    r"IS\s*(?:/\s*IEC\s*)?[:\s-]*\d{2,5}(?:\s*-\s*\d+)?"
    r"(?:\s*\(\s*Part\s*\d+(?:\s*/\s*Sec(?:tion)?\s*\d+)?[^)]*\))?"
    r"(?:\s*[:\-]\s*(\d{4}))?",
    re.I,
)
CERT_WORDS = {
    "ISI": re.compile(r"\b(ISI|BIS licen[cs]e|standard mark|CM/L)\b", re.I),
    "CRS": re.compile(r"\b(CRS|compulsory registration|R-\d{7,8}|BIS registration)\b", re.I),
    "Hallmarking": re.compile(r"\b(hallmark\w*|HUID)\b", re.I),
}
SEVERITY_WEIGHT = {"high": 18, "medium": 8, "low": 3}


def _finding(severity: str, kind: str, title: str, detail: str, citation: str = "", fix: str = "") -> dict:
    return {"severity": severity, "type": kind, "title": title, "detail": detail, "citation": citation, "fix": fix}


def _amendment_text(raw: dict) -> str:
    if not raw["amendments"]:
        return ""
    last = raw["amendments"][-1]
    return f" incl. Amendment No. {last['no']} ({last['year']})"


def check_citations(text: str, repo: StandardsRepository) -> tuple[list[dict], set[str]]:
    findings: list[dict] = []
    cited: set[str] = set()
    for match in CITATION.finditer(text):
        citation = re.sub(r"\s+", " ", match.group(0)).strip()
        year = int(match.group(1)) if match.group(1) else None
        standard = repo.find_by_reference(citation)
        if not standard:
            findings.append(_finding("low", "unknown", f"{citation} not in knowledge base",
                                     "Could not verify this reference. Confirm number and status on the BIS standards portal.", citation))
            continue
        if standard.id in cited:
            continue
        cited.add(standard.id)
        raw = standard.raw
        current = f"{standard.designation}{_amendment_text(raw)}"
        if year is None:
            findings.append(_finding("medium", "undated", f"Undated reference: {citation}",
                                     f"Undated references are ambiguous in a tender. Latest version is {current}.",
                                     citation, f"Cite {standard.designation} with all amendments, or state 'latest version with amendments'."))
        elif year < raw["year"]:
            findings.append(_finding("high", "outdated", f"Outdated version: {citation}",
                                     f"Version {year} has been superseded. Current: {current}.",
                                     citation, f"Replace with {standard.designation}."))
        elif year > raw["year"]:
            findings.append(_finding("low", "unknown", f"Unrecognised year: {citation}",
                                     f"Knowledge base lists {standard.designation} as latest. Verify on the BIS portal.", citation))
        else:
            findings.append(_finding("ok", "current", f"Current: {citation}", f"{current} is the latest published version.", citation))
    return findings, cited


def audit(text: str, repo: StandardsRepository, engine: RecommendationEngine) -> dict:
    findings, cited = check_citations(text, repo)
    recommended = engine.recommend(text, top_k=3)
    primary = [r for r in recommended["recommendations"] if r["confidence"] >= 55][:2]

    cited_categories = {repo.find_by_id(i).raw["category"] for i in cited if repo.find_by_id(i)}
    flagged_schemes: set[str] = set()
    for position, rec in enumerate(primary):
        covered = rec["category"] in cited_categories and position > 0
        if rec["id"] not in cited and not covered:
            findings.append(_finding("high", "missing", f"Applicable standard not cited: {rec['designation']}",
                                     f"Your text describes a product covered by {rec['designation']} - {rec['title']}.",
                                     fix=f"Add: 'shall conform to {rec['designation']} with latest amendments'."))
        cert = rec["certification"]
        pattern = CERT_WORDS.get(cert["scheme"])
        if cert["mandatory"] and pattern and not pattern.search(text) and cert["scheme"] not in flagged_schemes:
            flagged_schemes.add(cert["scheme"])
            findings.append(_finding("high", "certification", f"Mandatory {cert['scheme']} requirement missing",
                                     f"{rec['designation']} is under {cert['instrument']}.",
                                     fix=f"Add a clause requiring {cert['scheme']} certification with a valid BIS licence/registration."))

    allied_tests = [i for g in recommended["allied"] if g["type"] == "test_method" for i in g["items"]]
    missing_tests = [t for t in allied_tests if t["id"] not in cited][:3]
    if primary and missing_tests:
        names = ", ".join(t["designation"] for t in missing_tests)
        findings.append(_finding("medium", "test_method", "Test methods not specified",
                                 f"Acceptance testing is easier to enforce when methods are named: {names}.",
                                 fix=f"Add: 'Type and acceptance tests as per {names}'."))
    if primary and not re.search(r"\bsampl\w*|AQL|IS\s*2500|IS\s*4905", text, re.I):
        findings.append(_finding("low", "sampling", "No sampling plan stated",
                                 "Without a sampling plan, lot acceptance can be disputed.",
                                 fix="Add: 'Sampling and lot acceptance as per IS 2500 (Part 1) / IS 4905'."))

    penalty = sum(SEVERITY_WEIGHT.get(f["severity"], 0) for f in findings)
    score = max(0, 100 - penalty)
    counts = {sev: sum(1 for f in findings if f["severity"] == sev) for sev in ("high", "medium", "low", "ok")}
    order = {"high": 0, "medium": 1, "low": 2, "ok": 3}
    return {
        "score": score,
        "grade": "A" if score >= 85 else "B" if score >= 65 else "C" if score >= 45 else "D",
        "counts": counts,
        "findings": sorted(findings, key=lambda f: order[f["severity"]]),
        "suggested": recommended["recommendations"][:3],
    }
