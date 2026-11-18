"""Text extraction from uploaded tender documents and technical parameter detection."""
from __future__ import annotations

import io
import logging
import re

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = (".txt", ".pdf", ".docx", ".md")


class ExtractionError(ValueError):
    """Raised when a document cannot be read."""


def extract_text(filename: str, payload: bytes) -> str:
    name = filename.lower()
    if not name.endswith(ALLOWED_EXTENSIONS):
        raise ExtractionError("Upload a .pdf, .docx or .txt file.")
    try:
        if name.endswith(".pdf"):
            return _pdf_text(payload)
        if name.endswith(".docx"):
            return _docx_text(payload)
        return _plain_text(payload)
    except ExtractionError:
        raise
    except Exception as exc:  # parser libraries raise many different types
        logger.warning("Document extraction failed for %s: %s", filename, exc)
        raise ExtractionError("The document could not be read. Is it a valid, unprotected file?") from exc


def _plain_text(payload: bytes) -> str:
    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            return payload.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ExtractionError("Unsupported text encoding.")


def _pdf_text(payload: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(payload))
    pages = [page.extract_text() or "" for page in reader.pages[:60]]
    text = "\n".join(pages).strip()
    if not text:
        raise ExtractionError("No selectable text found in the PDF (scanned image PDFs need OCR).")
    return text


def _docx_text(payload: bytes) -> str:
    import docx

    document = docx.Document(io.BytesIO(payload))
    parts = [p.text for p in document.paragraphs]
    for table in document.tables:
        for row in table.rows:
            parts.append(" | ".join(cell.text for cell in row.cells))
    return "\n".join(parts).strip()


_ITEM_MARKER = re.compile(r"^\s*(?:item\s*)?(?:\d{1,3}(?:\.\d{1,2})?[.)\]:-]|\(?[a-z]\)|[-•*▪●])\s+", re.I)
_BOILERPLATE = re.compile(r"\b(earnest money|emd|bid security|delivery period|payment terms|warranty period|tender fee|last date|signature|seal of)\b", re.I)
MAX_ITEMS = 20


def split_items(text: str) -> list[str]:
    """Pull individual line items out of a tender / BOQ: numbered or bulleted lines and table rows."""
    items: list[str] = []
    for raw in text.splitlines():
        line = raw.strip()
        if "|" in line:  # table row from DOCX: keep the most descriptive cell
            line = max((c.strip() for c in line.split("|")), key=len, default="")
        elif not _ITEM_MARKER.match(line):
            continue
        line = _ITEM_MARKER.sub("", line).strip()
        if not 12 <= len(line) <= 400 or _BOILERPLATE.search(line):
            continue
        if line.lower() not in (i.lower() for i in items):
            items.append(line)
        if len(items) == MAX_ITEMS:
            break
    return items


_PARAMETER_PATTERNS = (
    ("Voltage", re.compile(r"\b(\d+(?:\.\d+)?\s?(?:k?V))\b", re.I)),
    ("Current", re.compile(r"\b(\d+(?:\.\d+)?\s?A)\b")),
    ("Power", re.compile(r"\b(\d+(?:\.\d+)?\s?(?:k?W|Wp))\b")),
    ("Cross-section", re.compile(r"\b(\d+(?:\.\d+)?\s?(?:sq\.?\s?mm|mm2|mm²))", re.I)),
    ("Capacity", re.compile(r"\b(\d+(?:\.\d+)?\s?(?:litres?|liters?|ltr|L|ton|tonnes?|TR))\b", re.I)),
    ("Grade", re.compile(r"\b(Fe\s?\d{3}[A-Z]?|E\s?\d{3}|M\s?\d{2}|OPC\s?\d{2}|\d{2}\s?grade|\d{2}\s?[Kk]arat|\d{2}\s?[Kk]\b|PE\s?\d{2,3})", re.I)),
    ("Dimension", re.compile(r"\b(\d+(?:\.\d+)?\s?(?:mm|cm|m)\b(?:\s?[x×]\s?\d+(?:\.\d+)?\s?(?:mm|cm|m)?)*)", re.I)),
    ("Material", re.compile(r"\b(copper|aluminium|aluminum|pvc|upvc|cpvc|xlpe|hdpe|stainless steel|galvani[sz]ed|polycarbonate|abs|mild steel)\b", re.I)),
    ("Pressure", re.compile(r"\b(\d+(?:\.\d+)?\s?(?:kgf/cm2|kg/cm2|bar|mpa))\b", re.I)),
)


def detect_parameters(text: str) -> list[dict]:
    """Return technical parameters found in the text, de-duplicated, at most 4 per type."""
    found: list[dict] = []
    for label, pattern in _PARAMETER_PATTERNS:
        seen: list[str] = []
        for match in pattern.finditer(text):
            value = re.sub(r"\s+", " ", match.group(1)).strip()
            if value.lower() not in (v.lower() for v in seen):
                seen.append(value)
            if len(seen) == 4:
                break
        found.extend({"type": label, "value": v} for v in seen)
    return found
