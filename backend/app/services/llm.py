"""Optional NVIDIA Nemotron layer (NVIDIA NIM API, OpenAI-compatible).

What it adds on top of the offline engine:
* translation of any language into English before retrieval, when the offline glossary misses words;
* re-ranking of the local shortlist with a one-line reason per standard.

It switches on only when ENABLE_LLM=true and NVIDIA_API_KEY is set. Every failure (network,
auth, rate limit, malformed output) falls back to the local ranking: the API never errors
because the LLM is unavailable.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Optional

import httpx

from ..config import settings

logger = logging.getLogger(__name__)

RERANK_PROMPT = (
    "You help Indian government procurement officers pick the Indian Standards (BIS) that apply "
    "to an item they are buying. You receive the officer's description (any Indian language or English) "
    "and a shortlist of candidate standards from a retrieval engine. Translate the description to "
    "English, then rank only the candidates that genuinely cover the item, most applicable first. "
    "Product specifications outrank test methods and codes of practice unless the officer asks for those. "
    "Give each a one-sentence reason a procurement officer can paste into a file noting. "
    "Use only candidate ids you were given. Reply with JSON only: "
    '{"english_query": "...", "ranking": [{"id": "...", "reason": "..."}]}'
)

TRANSLATE_PROMPT = (
    "Translate this procurement item description from any Indian language into plain English. "
    "Keep numbers, units, grades and brand-neutral technical terms. Reply with JSON only: "
    '{"english": "..."}'
)

RERANK_SCHEMA = {
    "type": "object",
    "properties": {
        "english_query": {"type": "string"},
        "ranking": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"id": {"type": "string"}, "reason": {"type": "string"}},
                "required": ["id", "reason"],
            },
        },
    },
    "required": ["english_query", "ranking"],
}

TRANSLATE_SCHEMA = {"type": "object", "properties": {"english": {"type": "string"}}, "required": ["english"]}

_THINK = re.compile(r"<think>.*?</think>", re.S | re.I)


def parse_json_reply(text: str) -> Optional[dict]:
    """Pull the JSON object out of a model reply (tolerates reasoning tags and code fences)."""
    cleaned = _THINK.sub("", text or "").strip()
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start == -1 or end <= start:
        return None
    try:
        value = json.loads(cleaned[start : end + 1])
    except json.JSONDecodeError:
        return None
    return value if isinstance(value, dict) else None


class NemotronClient:
    """Thin client for the NVIDIA NIM chat-completions endpoint."""

    def __init__(
        self,
        api_key: str,
        model: str = settings.llm_model,
        base_url: str = settings.llm_base_url,
        timeout: float = settings.llm_timeout_seconds,
        transport: httpx.BaseTransport | None = None,
    ):
        self.model = model
        self._client = httpx.Client(
            base_url=base_url.rstrip("/"),
            headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"},
            timeout=timeout,
            transport=transport,
        )

    def complete_json(self, system: str, user: str, schema: dict) -> Optional[dict]:
        """One chat completion that should return JSON. Retries once without optional extras."""
        base = {
            "model": self.model,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "temperature": 0.2,
            "top_p": 0.9,
            "max_tokens": 1200,
            "stream": False,
        }
        extras = {
            "response_format": {"type": "json_schema", "json_schema": {"name": "specsetu", "schema": schema}},
            "chat_template_kwargs": {"enable_thinking": False},
        }
        for payload in ({**base, **extras}, base):
            try:
                response = self._client.post("/chat/completions", json=payload)
            except httpx.HTTPError as exc:
                logger.warning("Nemotron unreachable, using local ranking: %s", type(exc).__name__)
                return None
            if response.status_code in (400, 422) and payload is not base:
                logger.info("Nemotron rejected structured-output options (%s); retrying plain", response.status_code)
                continue
            if response.status_code != 200:
                logger.warning("Nemotron returned HTTP %s; using local ranking", response.status_code)
                return None
            try:
                content = response.json()["choices"][0]["message"].get("content") or ""
            except (ValueError, KeyError, IndexError, TypeError):
                logger.warning("Nemotron returned an unexpected body; using local ranking")
                return None
            parsed = parse_json_reply(content)
            if parsed is None:
                logger.warning("Nemotron reply was not JSON; using local ranking")
            return parsed
        return None


class NemotronReranker:
    """Re-ranks and explains the shortlist; translates input the glossary could not."""

    provider = "NVIDIA Nemotron"

    def __init__(self, client: NemotronClient | None = None):
        if client is None and settings.enable_llm and settings.nvidia_api_key:
            client = NemotronClient(settings.nvidia_api_key)
        self._client = client

    @property
    def enabled(self) -> bool:
        return self._client is not None

    @property
    def model(self) -> str:
        return self._client.model if self._client else ""

    def translate(self, text: str) -> Optional[str]:
        if not self._client:
            return None
        reply = self._client.complete_json(TRANSLATE_PROMPT, text, TRANSLATE_SCHEMA)
        english = (reply or {}).get("english")
        return english.strip() if isinstance(english, str) and english.strip() else None

    def rerank(self, query: str, candidates: list[dict]) -> Optional[dict]:
        if not self._client or not candidates:
            return None
        shortlist = [{"id": c["id"], "designation": c["designation"], "title": c["title"], "scope": c["scope"]} for c in candidates]
        user = f"Officer's description:\n{query}\n\nCandidates (JSON):\n{json.dumps(shortlist, ensure_ascii=False)}"
        reply = self._client.complete_json(RERANK_PROMPT, user, RERANK_SCHEMA)
        if not reply:
            return None
        valid_ids = {c["id"] for c in candidates}
        seen: set[str] = set()
        ranking = []
        for row in reply.get("ranking") or []:
            if not isinstance(row, dict):
                continue
            rid, reason = row.get("id"), row.get("reason")
            if rid in valid_ids and rid not in seen and isinstance(reason, str):
                seen.add(rid)
                ranking.append({"id": rid, "reason": reason.strip()[:300]})
        if not ranking:
            return None
        english = reply.get("english_query")
        return {"english_query": english if isinstance(english, str) else "", "ranking": ranking}
