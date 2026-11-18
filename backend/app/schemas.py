"""Request models and the shared API response envelope."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator

from .config import settings


class RecommendRequest(BaseModel):
    query: str = Field(..., description="Product description, technical specification or tender text")
    top_k: int = Field(5, ge=1, le=10)
    language: Optional[str] = Field(None, description="ISO code hint, e.g. 'hi'. Auto-detected when omitted.")

    @field_validator("query")
    @classmethod
    def _query_ok(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise ValueError("Describe the product in at least a few words.")
        if len(cleaned) > settings.max_query_chars:
            raise ValueError(f"Input is longer than {settings.max_query_chars} characters.")
        return cleaned


class AuditRequest(BaseModel):
    text: str = Field(..., description="Draft tender specification to check")

    @field_validator("text")
    @classmethod
    def _text_ok(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 10:
            raise ValueError("Paste the specification text to audit (at least 10 characters).")
        if len(cleaned) > settings.max_query_chars:
            raise ValueError(f"Input is longer than {settings.max_query_chars} characters.")
        return cleaned


class BatchRequest(BaseModel):
    items: list[str] = Field(..., min_length=1, max_length=25, description="Line items of a tender or bill of quantities")

    @field_validator("items")
    @classmethod
    def _items_ok(cls, value: list[str]) -> list[str]:
        cleaned = [v.strip() for v in value if v and v.strip()]
        if not cleaned:
            raise ValueError("Send at least one non-empty item.")
        if any(len(v) > 2000 for v in cleaned):
            raise ValueError("Each item must be under 2000 characters.")
        return cleaned


class FeedbackRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    standard_id: str = Field(..., min_length=2, max_length=60, pattern=r"^[a-z0-9-]+$")
    helpful: bool
    comment: str = Field("", max_length=500)


def ok(data: Any, meta: Optional[dict] = None) -> dict:
    return {"success": True, "data": data, "error": None, "meta": meta or {}}


def fail(message: str) -> dict:
    return {"success": False, "data": None, "error": message, "meta": {}}
