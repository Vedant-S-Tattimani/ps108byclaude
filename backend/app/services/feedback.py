"""Officer feedback on recommendations (append-only JSON Lines store).

Each vote is a labelled example: in production these feed weight tuning and a
re-ranker so the engine learns from procurement officers' corrections.
"""
from __future__ import annotations

import json
import threading
import time
from pathlib import Path


class FeedbackStore:
    def __init__(self, path: Path):
        self.path = path
        self._lock = threading.Lock()

    def add(self, query: str, standard_id: str, helpful: bool, comment: str = "") -> dict:
        record = {"ts": int(time.time()), "query": query[:500], "standard_id": standard_id, "helpful": helpful, "comment": comment[:500]}
        with self._lock:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            with self.path.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps(record, ensure_ascii=False) + "\n")
        return record

    def summary(self) -> dict:
        if not self.path.exists():
            return {"total": 0, "helpful": 0, "not_helpful": 0, "by_standard": {}}
        by_standard: dict[str, dict[str, int]] = {}
        helpful = total = 0
        with self._lock, self.path.open(encoding="utf-8") as fh:
            for line in fh:
                try:
                    row = json.loads(line)
                except json.JSONDecodeError:
                    continue
                total += 1
                helpful += 1 if row.get("helpful") else 0
                entry = by_standard.setdefault(row.get("standard_id", "?"), {"up": 0, "down": 0})
                entry["up" if row.get("helpful") else "down"] += 1
        return {"total": total, "helpful": helpful, "not_helpful": total - helpful, "by_standard": by_standard}
