"""Script detection and glossary-based translation of Indian-language queries."""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

# Unicode blocks of the scheduled-language scripts most used in procurement text.
_SCRIPTS = (
    ("hi", "Hindi / Marathi (Devanagari)", 0x0900, 0x097F),
    ("bn", "Bengali / Assamese", 0x0980, 0x09FF),
    ("pa", "Punjabi (Gurmukhi)", 0x0A00, 0x0A7F),
    ("gu", "Gujarati", 0x0A80, 0x0AFF),
    ("or", "Odia", 0x0B00, 0x0B7F),
    ("ta", "Tamil", 0x0B80, 0x0BFF),
    ("te", "Telugu", 0x0C00, 0x0C7F),
    ("kn", "Kannada", 0x0C80, 0x0CFF),
    ("ml", "Malayalam", 0x0D00, 0x0D7F),
)
# Function words that carry no product meaning; skipped instead of reported as untranslated.
_STOPWORDS = frozenset(
    "का की के को में से पर और या है हैं के लिए लिये हेतु एक यह वह तथा द्वारा वाला वाली वाले "
    "மற்றும் ஒரு ও এবং একটি మరియు ఒక".split()
)
_PUNCT = re.compile(r"[\s,.;:!?()\[\]{}\"'।॥/\\|-]+")


@dataclass(frozen=True)
class LanguageResult:
    code: str
    name: str
    translated: str
    glossary_hits: tuple[str, ...]
    untranslated: tuple[str, ...]


def detect_language(text: str) -> tuple[str, str]:
    counts: dict[str, int] = {}
    latin = 0
    for ch in text:
        cp = ord(ch)
        if ch.isascii() and ch.isalpha():
            latin += 1
            continue
        for code, _name, lo, hi in _SCRIPTS:
            if lo <= cp <= hi:
                counts[code] = counts.get(code, 0) + 1
                break
    if not counts or latin > max(counts.values()) * 2:
        return "en", "English"
    code = max(counts, key=counts.get)
    name = next(n for c, n, _lo, _hi in _SCRIPTS if c == code)
    return code, name


def _lookup(token: str, glossary: dict[str, str]) -> str | None:
    if token in glossary:
        return glossary[token]
    # Inflected forms: try the longest glossary entry the token starts with.
    candidates = [k for k in glossary if len(k) >= 2 and token.startswith(k)]
    if candidates:
        return glossary[max(candidates, key=len)]
    return None


def normalise_digits(text: str) -> str:
    """Convert Indic digits (e.g. Gujarati ૫૩, Devanagari ५३) to ASCII so ratings and grades survive."""
    return "".join(str(unicodedata.digit(ch)) if ch.isdigit() and not ch.isascii() else ch for ch in text)


def translate(text: str, glossaries: dict[str, dict[str, str]], hint: str | None = None) -> LanguageResult:
    text = normalise_digits(text)
    code, name = detect_language(text)
    if hint and hint != "en" and code == "en":
        code = hint
    if code == "en":
        return LanguageResult("en", "English", text, (), ())

    glossary = glossaries.get(code, {})
    out: list[str] = []
    hits: list[str] = []
    missing: list[str] = []
    for token in _PUNCT.split(text):
        if not token or token in _STOPWORDS:
            continue
        if token.isascii():
            out.append(token)
            continue
        english = _lookup(token, glossary)
        if english:
            out.append(english)
            hits.append(f"{token} -> {english}")
        else:
            missing.append(token)
    return LanguageResult(code, name, " ".join(out), tuple(hits), tuple(missing))
