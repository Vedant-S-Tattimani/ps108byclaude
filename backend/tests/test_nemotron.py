"""NVIDIA Nemotron layer, exercised against a mocked NIM endpoint (no network, no key)."""
import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import create_app
from app.services.llm import NemotronClient, NemotronReranker, parse_json_reply
from app.services.recommender import Services


def chat_reply(content: str) -> httpx.Response:
    return httpx.Response(200, json={"choices": [{"message": {"role": "assistant", "content": content}}]})


class FakeNim:
    """Records requests and answers like integrate.api.nvidia.com/v1/chat/completions."""

    def __init__(self, handler):
        self.requests: list[dict] = []
        self.handler = handler

    def __call__(self, request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        self.requests.append({"url": str(request.url), "auth": request.headers.get("authorization"), "body": body})
        return self.handler(body)


def make_reranker(handler) -> tuple[NemotronReranker, FakeNim]:
    fake = FakeNim(handler)
    client = NemotronClient("nvapi-test", model="nvidia/test-nemotron", base_url="https://nim.test/v1", transport=httpx.MockTransport(fake))
    return NemotronReranker(client), fake


def rerank_handler(body: dict) -> httpx.Response:
    system = body["messages"][0]["content"]
    if "Translate this procurement item" in system:
        return chat_reply(json.dumps({"english": "drinking water pipe for village supply"}))
    return chat_reply(json.dumps({
        "english_query": "drinking water pipe",
        "ranking": [
            {"id": "is-4985", "reason": "uPVC pipes for potable water supply."},
            {"id": "not-a-candidate", "reason": "should be dropped"},
            {"id": "is-4985", "reason": "duplicate should be dropped"},
        ],
    }))


CANDIDATES = [
    {"id": "is-10500", "designation": "IS 10500:2012", "title": "Drinking water", "scope": "Water quality"},
    {"id": "is-4985", "designation": "IS 4985:2021", "title": "uPVC pipes for water supplies", "scope": "Pipes"},
]


def test_request_shape_matches_nim_api():
    reranker, fake = make_reranker(rerank_handler)
    reranker.rerank("water pipe", CANDIDATES)
    sent = fake.requests[0]
    assert sent["url"] == "https://nim.test/v1/chat/completions"
    assert sent["auth"] == "Bearer nvapi-test"
    assert sent["body"]["model"] == "nvidia/test-nemotron"
    assert sent["body"]["response_format"]["type"] == "json_schema"
    assert sent["body"]["chat_template_kwargs"] == {"enable_thinking": False}


def test_rerank_keeps_only_valid_unique_candidates():
    reranker, _ = make_reranker(rerank_handler)
    result = reranker.rerank("water pipe", CANDIDATES)
    assert result["ranking"] == [{"id": "is-4985", "reason": "uPVC pipes for potable water supply."}]


def test_retries_without_structured_options_when_model_rejects_them():
    def handler(body: dict) -> httpx.Response:
        if "response_format" in body:
            return httpx.Response(400, json={"error": "response_format not supported"})
        return chat_reply('{"english_query": "cement", "ranking": [{"id": "is-4985", "reason": "ok"}]}')

    reranker, fake = make_reranker(handler)
    assert reranker.rerank("cement", CANDIDATES)["ranking"][0]["id"] == "is-4985"
    assert len(fake.requests) == 2 and "response_format" not in fake.requests[1]["body"]


@pytest.mark.parametrize("response", [
    httpx.Response(401, json={"error": "bad key"}),
    httpx.Response(429, json={"error": "rate limited"}),
    httpx.Response(500, text="oops"),
    chat_reply("I think the answer is IS 4985 but no JSON here"),
    httpx.Response(200, json={"unexpected": True}),
])
def test_failures_fall_back_to_local_ranking(response):
    reranker, _ = make_reranker(lambda body: response)
    assert reranker.rerank("water pipe", CANDIDATES) is None


def test_network_error_falls_back():
    def boom(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("no route")

    client = NemotronClient("nvapi-test", base_url="https://nim.test/v1", transport=httpx.MockTransport(boom))
    assert NemotronReranker(client).rerank("x", CANDIDATES) is None


@pytest.mark.parametrize("text, expected", [
    ('{"a": 1}', {"a": 1}),
    ('<think>reasoning...</think>\n{"a": 2}', {"a": 2}),
    ('```json\n{"a": 3}\n```', {"a": 3}),
    ("no json", None),
    ("[1, 2]", None),
])
def test_parse_json_reply(text, expected):
    assert parse_json_reply(text) == expected


def test_layer_is_off_without_a_client():
    # conftest sets ENABLE_LLM=false, so no client is built even if a key is present
    reranker = NemotronReranker(None)
    assert reranker.enabled is False
    assert reranker.rerank("x", CANDIDATES) is None
    assert reranker.translate("x") is None


def test_end_to_end_with_nemotron_translates_reranks_and_reports(tmp_path):
    reranker, fake = make_reranker(rerank_handler)
    services = Services.build(settings.standards_path, settings.lexicon_path, tmp_path / "fb.jsonl", reranker=reranker)
    client = TestClient(create_app(services))

    health = client.get("/api/health").json()["data"]
    assert health["llm_enabled"] is True and health["llm_provider"] == "NVIDIA Nemotron"

    # Assamese-style sentence with words outside the offline glossary -> Nemotron translates first
    data = client.post("/api/recommend", json={"query": "গাঁওৰ খোৱা পানীৰ পাইপ"}).json()["data"]
    assert data["engine"].endswith("+ NVIDIA Nemotron re-ranking")
    assert data["language"]["translated_by_llm"] is True
    assert data["language"]["english_query"] == "drinking water pipe for village supply"
    assert data["recommendations"][0]["id"] == "is-4985"
    assert data["recommendations"][0]["reasons"][0] == "uPVC pipes for potable water supply."
    assert len(fake.requests) == 2  # one translate call, one re-rank call


def test_confidence_is_strictly_decreasing_after_rerank():
    recs = [
        {"id": "a", "confidence": 96, "reasons": ["x"]},
        {"id": "b", "confidence": 95, "reasons": ["y"]},
        {"id": "c", "confidence": 30, "reasons": ["z"]},
    ]
    out = Services._apply_llm(recs, [{"id": "b", "reason": "best"}, {"id": "a", "reason": "next"}])
    assert [r["id"] for r in out] == ["b", "a", "c"]
    scores = [r["confidence"] for r in out]
    assert scores == sorted(scores, reverse=True) and len(set(scores)) == len(scores)
    assert out[0]["reasons"][0] == "best"
