"""Runtime settings, read once from environment variables."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
ENV_FILE = Path(__file__).resolve().parents[1] / ".env"

try:  # backend/.env is optional; real environment variables always win
    from dotenv import load_dotenv

    load_dotenv(ENV_FILE, override=False)
except ImportError:  # python-dotenv not installed: rely on the process environment only
    pass


def _env_list(name: str, default: str) -> tuple[str, ...]:
    raw = os.getenv(name, default)
    return tuple(item.strip() for item in raw.split(",") if item.strip())


@dataclass(frozen=True)
class Settings:
    app_name: str = "SpecSetu API"
    version: str = "1.0.0"
    standards_path: Path = DATA_DIR / "standards.json"
    lexicon_path: Path = DATA_DIR / "lexicon.json"
    cors_origins: tuple[str, ...] = field(
        default_factory=lambda: _env_list(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        )
    )
    max_query_chars: int = int(os.getenv("MAX_QUERY_CHARS", "20000"))
    max_upload_bytes: int = int(os.getenv("MAX_UPLOAD_BYTES", str(5 * 1024 * 1024)))
    feedback_path: Path = Path(os.getenv("FEEDBACK_PATH", str(DATA_DIR / "runtime" / "feedback.jsonl")))
    rate_limit_per_minute: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    # Optional NVIDIA Nemotron enhancement (re-ranking, explanations, translation of any language).
    enable_llm: bool = os.getenv("ENABLE_LLM", "true").lower() == "true"
    nvidia_api_key: str = field(default_factory=lambda: os.getenv("NVIDIA_API_KEY", "").strip(), repr=False)
    llm_model: str = os.getenv("LLM_MODEL", "nvidia/nemotron-3.5-lightning-30b-a3b")
    llm_base_url: str = os.getenv("LLM_BASE_URL", "https://integrate.api.nvidia.com/v1")
    llm_timeout_seconds: float = float(os.getenv("LLM_TIMEOUT_SECONDS", "30"))


settings = Settings()
