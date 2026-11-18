import pytest

from app.config import settings
from app.services.language import detect_language, translate
from app.services.recommender import Services
from app.services.repository import reference_key


@pytest.fixture(scope="module")
def services() -> Services:
    return Services.build(settings.standards_path, settings.lexicon_path)


def top_ids(services: Services, query: str, k: int = 1) -> list[str]:
    return [r["id"] for r in services.recommend(query, k)["recommendations"]][:k]


@pytest.mark.parametrize(
    "query, expected",
    [
        ("1.1 kV XLPE armoured aluminium power cable for substation", "is-7098-1"),
        ("geyser for hostel bathrooms 25 litre", "is-2082"),
        ("LED street lights for municipal roads", "is-10322-5-3"),
        ("TMT saria Fe 500D for building construction", "is-1786"),
        ("22 carat gold medals for awards", "is-1417"),
        ("laptops for school computer lab", "is-13252-1"),
        ("helmets for traffic police two wheelers", "is-4151"),
        ("copper house wiring cabel 1.5 sq mm", "is-694"),
        ("solar panels rooftop 5 kW", "is-14286"),
        ("fire extinguisher ABC 6 kg for school", "is-15683"),
    ],
)
def test_semantic_top_match(services, query, expected):
    assert top_ids(services, query) == [expected]


def test_hindi_query_is_translated_and_matched(services):
    result = services.recommend("बोतलबंद पीने का पानी 20 लीटर जार", 3)
    assert result["language"]["code"] == "hi"
    assert "drinking water" in result["language"]["english_query"]
    assert result["recommendations"][0]["id"] == "is-14543"


def test_tamil_query_detected(services):
    result = services.recommend("குடிநீர் குழாய்", 3)
    assert result["language"]["code"] == "ta"
    assert any(r["id"] == "is-4985" for r in result["recommendations"])


def test_unrelated_query_flags_low_confidence(services):
    assert services.recommend("paint for walls", 3)["low_confidence"] is True


def test_allied_standards_grouped_by_relation(services):
    result = services.recommend("XLPE armoured cable 1.1kV", 3)
    types = {g["type"] for g in result["allied"]}
    assert {"normative", "test_method", "terminology", "installation", "sampling"} <= types
    tests = next(g for g in result["allied"] if g["type"] == "test_method")
    assert any(i["id"] == "is-10810" for i in tests["items"])


def test_mandatory_certification_reported(services):
    certs = services.recommend("LED bulb 9W B22", 3)["certifications"]
    assert any(c["scheme"] == "CRS" and c["mandatory"] for c in certs)


def test_clause_cites_latest_version_and_certification(services):
    clause = services.recommend("TMT bars Fe 500D", 3)["clause"]
    assert "IS 1786:2008" in clause
    assert "ISI certification is mandatory" in clause


def test_parameters_detected(services):
    params = services.recommend("XLPE copper cable 1100 V 4 sq mm", 3)["parameters"]
    found = {(p["type"], p["value"]) for p in params}
    assert ("Voltage", "1100 V") in found
    assert ("Material", "copper") in found


def test_audit_finds_outdated_undated_and_missing_cert(services):
    report = services.audit("Supply of PVC insulated copper wires conforming to IS 694:1990 and IS 8130. Tests as per IS 10810.")
    kinds = {f["type"] for f in report["findings"]}
    assert {"outdated", "undated", "certification", "sampling"} <= kinds
    assert report["score"] < 60


def test_audit_clean_spec_scores_well(services):
    text = ("Cables shall conform to IS 694:2010 with ISI mark under valid BIS licence. Conductors per IS 8130:2013. "
            "Tests per IS 10810:1984. Sampling per IS 2500 (Part 1).")
    report = services.audit(text)
    assert report["counts"]["high"] == 0
    assert report["grade"] in {"A", "B"}


@pytest.mark.parametrize(
    "text, key",
    [("IS 1554 (Part 1):1988", "1554-1"), ("IS/IEC 60898-1", "60898-1"), ("IS 10322 (Part 5/Sec 3)", "10322-5-3"), ("is 694", "694")],
)
def test_reference_key(text, key):
    assert reference_key(text) == key


def test_detect_language_english():
    assert detect_language("LED lamp")[0] == "en"


def test_translate_reports_unknown_words():
    result = translate("सरिया xyz अज्ञात", {"hi": {"सरिया": "tmt bar"}})
    assert "tmt bar" in result.translated
    assert "अज्ञात" in result.untranslated
