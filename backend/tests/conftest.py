"""Test-wide setup: keep the suite offline and deterministic.

Even if a developer has NVIDIA_API_KEY in backend/.env, tests must never call the live
NVIDIA API. Nemotron behaviour is covered with a mocked transport in test_nemotron.py.
"""
import os

os.environ["ENABLE_LLM"] = "false"
os.environ["RATE_LIMIT_PER_MINUTE"] = os.environ.get("RATE_LIMIT_PER_MINUTE", "1000")
