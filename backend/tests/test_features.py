"""Features added after comparing SpecSetu with BIS, GeM, BIS Care and commercial standards platforms."""
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import create_app
from app.services.certificates import check_certificate
from app.services.parameters import check_parameters
from app.services.recommender import Services


@pytest.fixture()
def client(tmp_path) -> TestClient:
    services = Services.build(settings.standards_path, settings.lexicon_path, tmp_path / "feedback.jsonl")
    return TestClient(create_app(services))


# Key-parameter checklist (GeM "golden parameters" idea)
def test_checklist_marks_stated_and_missing_parameters():
    result = check_parameters("Electrical - Cables & Wires", "copper cable 2.5 sq mm 1100 V")
    stated = {i["name"]: i["present"] for i in result["items"]}
    assert stated["Conductor material"] and stated["Cross-section (sq mm)"] and stated["Voltage grade"]
    assert not stated["Armoured or unarmoured"]
    assert 0 < result["completeness"] < 100


def test_recommend_returns_checklist_and_clause_blanks(client):
    data = client.post("/api/recommend", json={"query": "LED street light 90W"}).json()["data"]
    checklist = data["spec_checklist"]
    assert checklist["category"] == "Lighting"
    assert any(i["name"] == "Wattage" and i["value"] == "90w" for i in checklist["items"])
    assert "Key parameters (to be stated by the buyer)" in data["clause"]
    assert "Ingress protection: ________" in data["clause"]


def test_unknown_category_falls_back_to_quantity():
    assert check_parameters("Something new", "50 nos")["items"][0]["name"] == "Quantity and unit"


# Revision and amendment tracking
def test_updates_feed_lists_recent_changes_newest_first(client):
    body = client.get("/api/updates", params={"since": 2018}).json()
    years = [row["last_changed"] for row in body["data"]]
    assert body["meta"]["total"] == len(years) > 5
    assert years == sorted(years, reverse=True)
    assert all(y >= 2018 for y in years)
    ids = {row["id"] for row in body["data"]}
    assert "is-3854" in ids and "is-1786" not in ids


def test_updates_rejects_bad_year(client):
    assert client.get("/api/updates", params={"since": 1200}).status_code == 422


# Certificate number checks
@pytest.mark.parametrize("number, kind", [("CM/L-7600012345", "ISI licence (CM/L)"), ("R-41001234", "CRS registration (R-number)"), ("ab12cd", "Hallmark HUID"), ("12", "Unrecognised")])
def test_certificate_format(number, kind):
    assert check_certificate(number)["type"] == kind


def test_certificate_endpoint_points_to_official_verification(client):
    data = client.get("/api/certificate/check", params={"number": "CM/L-7600012345"}).json()["data"]
    assert data["valid_format"] is True
    assert any("bis.gov.in" in link for link in data["links"])


# Feedback loop
def test_feedback_is_stored_and_summarised(client):
    assert client.post("/api/feedback", json={"query": "cement", "standard_id": "is-269", "helpful": True}).status_code == 200
    client.post("/api/feedback", json={"query": "cement", "standard_id": "is-1489-1", "helpful": False, "comment": "wanted OPC"})
    summary = client.get("/api/feedback/summary").json()["data"]
    assert summary["total"] == 2 and summary["helpful"] == 1
    assert summary["by_standard"]["is-269"] == {"up": 1, "down": 0}


@pytest.mark.parametrize("payload, status", [
    ({"query": "x", "standard_id": "does-not-exist", "helpful": True}, 404),
    ({"query": "x", "standard_id": "../etc", "helpful": True}, 422),
])
def test_feedback_validation(client, payload, status):
    assert client.post("/api/feedback", json=payload).status_code == status


# Official links and portal widget
def test_standard_has_official_link(client):
    assert client.get("/api/standards/is-269").json()["data"]["official_url"].startswith("https://www.bis.gov.in/")


def test_widget_assets_are_served(client):
    script = client.get("/widget.js")
    assert script.status_code == 200 and "javascript" in script.headers["content-type"]
    assert "data-specsetu" in script.text and "innerHTML" not in script.text
    assert "widget.js" in client.get("/widget-demo").text
