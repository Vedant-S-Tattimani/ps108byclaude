"""One test per expected feature in problem statement 26108, so the mapping stays honest."""
import io

import docx
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.services.extractor import split_items

TENDER = """NOTICE INVITING TENDER
Schedule of requirements:
1. PVC insulated copper house wiring cable 2.5 sq mm, 1100 V - 50 coils
2. LED street light luminaire 90W with driver - 120 nos
3) TMT reinforcement bars Fe 500D, 12 mm - 20 MT
4. OPC 53 grade cement - 400 bags
- Earnest money deposit Rs 50,000
5. Packaged drinking water 20 litre jars - 300 nos
"""
EXPECTED_ITEMS = ["is-694", "is-10322-5-3", "is-1786", "is-269", "is-14543"]


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(create_app())


# 1. Accept product descriptions, technical specifications or tender documents
def test_r1_tender_document_is_split_into_line_items(client):
    response = client.post("/api/recommend/upload", files={"file": ("nit.txt", io.BytesIO(TENDER.encode()), "text/plain")})
    items = response.json()["data"]["items"]
    assert [row["standard"]["id"] for row in items] == EXPECTED_ITEMS


def test_r1_docx_table_rows_are_read(client):
    document = docx.Document()
    table = document.add_table(rows=3, cols=3)
    rows = [("Sl", "Description of item", "Qty"),
            ("1", "Protective helmets for two-wheeler riders, full face", "40"),
            ("2", "Laptops for district office, 16 GB RAM", "25")]
    for r, values in enumerate(rows):
        for c, value in enumerate(values):
            table.cell(r, c).text = value
    buffer = io.BytesIO()
    document.save(buffer)
    response = client.post("/api/recommend/upload", files={"file": ("boq.docx", io.BytesIO(buffer.getvalue()), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")})
    ids = [row["standard"]["id"] for row in response.json()["data"]["items"]]
    assert "is-4151" in ids and "is-13252-1" in ids


def test_r1_boilerplate_lines_are_not_items():
    assert not any("Earnest" in item for item in split_items(TENDER))


# 2. Semantic understanding rather than keyword matching
@pytest.mark.parametrize("query, expected", [
    ("geyser for hostel bathrooms", "is-2082"),        # word not in title
    ("saria for column casting", "is-1786"),           # colloquial term
    ("copper house wiring cabel", "is-694"),           # misspelling
    ("Which standard applies when we buy LED bulbs for offices?", "is-16102-1"),  # natural question
])
def test_r2_semantic_matching(client, query, expected):
    data = client.post("/api/recommend", json={"query": query}).json()["data"]
    assert data["recommendations"][0]["id"] == expected


# 3. Allied standards of every kind named in the statement
def test_r3_allied_standard_kinds(client):
    kinds = set()
    for query in ("XLPE armoured cable 1.1 kV", "LED bulb 9W", "split air conditioner 1.5 ton"):
        data = client.post("/api/recommend", json={"query": query}).json()["data"]
        kinds |= {g["type"] for g in data["allied"]}
    assert {"normative", "test_method", "terminology", "safety", "installation", "related_product"} <= kinds


# 4. Latest published version and amendments
def test_r4_latest_version_and_amendments(client):
    top = client.post("/api/recommend", json={"query": "TMT bars Fe 500D"}).json()["data"]["recommendations"][0]
    assert top["designation"] == "IS 1786:2008"
    assert top["latest_amendment"] == {"no": 3, "year": 2017}
    assert 1985 in top["previous_versions"]


# 5. Mandatory certification: BIS product certification, CRS, Hallmarking
@pytest.mark.parametrize("query, scheme", [("OPC 53 grade cement", "ISI"), ("laptop computers", "CRS"), ("22 carat gold jewellery", "Hallmarking")])
def test_r5_mandatory_certification(client, query, scheme):
    certs = client.post("/api/recommend", json={"query": query}).json()["data"]["certifications"]
    assert any(c["scheme"] == scheme and c["mandatory"] for c in certs)


# 6. Multilingual input in every supported script
@pytest.mark.parametrize("query, code, expected", [
    ("सीमेंट भवन निर्माण के लिए", "hi", "is-269"),
    ("पिण्याचे पाणी बाटली", "hi", "is-14543"),
    ("સિમેન્ટ ૫૩ ગ્રેડ", "gu", "is-269"),
    ("ಕುಡಿಯುವ ನೀರು ಪೈಪ್", "kn", "is-4985"),
    ("ਸੀਮਿੰਟ", "pa", "is-269"),
    ("സിമന്റ്", "ml", "is-269"),
    ("ସିମେଣ୍ଟ", "or", "is-269"),
    ("தலைக்கவசம்", "ta", "is-4151"),
    ("সোনা গহনা", "bn", "is-1417"),
    ("కంప్యూటర్", "te", "is-13252-1"),
])
def test_r6_multilingual(client, query, code, expected):
    data = client.post("/api/recommend", json={"query": query, "top_k": 3}).json()["data"]
    assert data["language"]["code"] == code
    assert expected in [r["id"] for r in data["recommendations"]]


# Integration with procurement portals: batch endpoint for a BOQ
def test_portal_batch_endpoint(client):
    body = client.post("/api/recommend/batch", json={"items": ["OPC 53 grade cement", "LED street light 90W"]}).json()
    assert body["meta"]["total"] == 2
    assert [r["standard"]["id"] for r in body["data"]] == ["is-269", "is-10322-5-3"]


def test_portal_batch_rejects_empty(client):
    assert client.post("/api/recommend/batch", json={"items": [" "]}).status_code == 422
