"""Format checks for BIS certificate numbers, with the official place to verify them.

SpecSetu does not query BIS: it checks that a number a bidder quotes is well formed and
points the officer to the official verification route (BIS Care app / Manak Online).
"""
from __future__ import annotations

import re

BIS_CARE_URL = "https://www.services.bis.gov.in/php/BIS_2.0/BISBlog/bis-care-app/"
MANAK_ONLINE_URL = "https://www.manakonline.in/"

_RULES = (
    ("ISI licence (CM/L)", re.compile(r"^CM/?L[-\s]?\d{7,10}$", re.I), "Verify Licence Details in the BIS Care app, or search the licence on Manak Online."),
    ("CRS registration (R-number)", re.compile(r"^R[-\s]?\d{7,8}$", re.I), "Use 'Verify R-no. under CRS' in the BIS Care app."),
    ("Hallmark HUID", re.compile(r"^[A-Z0-9]{6}$", re.I), "Use 'Verify HUID' in the BIS Care app to see the jeweller, purity and hallmarking date."),
)


def check_certificate(number: str) -> dict:
    cleaned = number.strip().upper()
    for kind, pattern, how in _RULES:
        if pattern.match(cleaned):
            return {"number": cleaned, "type": kind, "valid_format": True, "how_to_verify": how, "links": [BIS_CARE_URL, MANAK_ONLINE_URL]}
    return {
        "number": cleaned,
        "type": "Unrecognised",
        "valid_format": False,
        "how_to_verify": "Expected CM/L-XXXXXXXXXX (ISI licence), R-XXXXXXXX (CRS) or a 6-character HUID. Ask the bidder to re-check the number.",
        "links": [BIS_CARE_URL, MANAK_ONLINE_URL],
    }
