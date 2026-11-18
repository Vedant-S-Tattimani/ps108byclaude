"""Key parameters a tender specification should state, per product category.

Mirrors the idea of GeM's "golden parameters": a spec that names a standard but leaves out
voltage grade, size or grade is still ambiguous. Each check is a regex over the user's text.
"""
from __future__ import annotations

import re

Param = tuple[str, str]  # (label, regex)

QUANTITY: Param = ("Quantity and unit", r"\b\d+\s?(nos?|numbers?|pcs|pieces|sets?|units?|coils?|drums?|bags?|mt|tonnes?|kg|m|metres?|meters?|km|litres?|ltrs?|jars?|bottles?)\b")

CATEGORY_PARAMETERS: dict[str, list[Param]] = {
    "Electrical - Cables & Wires": [
        ("Conductor material", r"copper|alumini?um"),
        ("Cross-section (sq mm)", r"\d+(\.\d+)?\s?(sq\.?\s?mm|mm2|mm²)"),
        ("Voltage grade", r"\d+(\.\d+)?\s?k?v\b|450/750"),
        ("Number of cores", r"\b\d+(\.\d+)?\s?(core|c)\b|single[- ]core|multi[- ]?core|twin"),
        ("Insulation type", r"\b(pvc|xlpe|frls|hffr|hr[- ]?pvc)\b"),
        ("Armoured or unarmoured", r"\b(un)?armou?red\b"),
        QUANTITY,
    ],
    "Electrical - Switchgear & Accessories": [
        ("Rated current (A)", r"\b\d+\s?a\b|\bamps?\b"),
        ("Number of poles", r"\b(sp|dp|tp|tpn|fp|\d\s?pole)\b|single pole|double pole"),
        ("Tripping curve / sensitivity", r"\b[bcd][- ]?curve\b|\b\d+\s?ma\b"),
        ("Breaking capacity", r"\b\d+(\.\d+)?\s?ka\b"),
        QUANTITY,
    ],
    "Lighting": [
        ("Wattage", r"\b\d+\s?w\b|watt"),
        ("Luminous efficacy / lumens", r"lm/w|lumens?|\blm\b|efficacy"),
        ("Colour temperature", r"\b\d{4}\s?k\b|cool white|warm white|daylight"),
        ("Ingress protection", r"\bip\s?\d{2}\b"),
        ("Cap / mounting type", r"\b(b22|e27|pole|recessed|surface|batten|panel|flood)\b"),
        QUANTITY,
    ],
    "Steel & Metals": [
        ("Grade", r"\bfe\s?\d{3}[a-z]?\b|\be\s?\d{3}\b|mild steel|\bms\b"),
        ("Size / diameter", r"\b\d+(\.\d+)?\s?mm\b|nb\b|\bod\b"),
        ("Class / thickness", r"\b(light|medium|heavy)\b|thickness|\bswg\b"),
        ("Coating", r"galvani[sz]ed|\bgi\b|epoxy|black"),
        QUANTITY,
    ],
    "Civil & Construction": [
        ("Grade / class", r"\b(opc|ppc|psc)\b|\b\d{2}\s?grade\b|\bm\s?\d{2}\b|class\s?\d+"),
        ("Size / dimensions", r"\b\d+\s?(mm|cm)\b|\d+\s?x\s?\d+"),
        ("Strength", r"compressive|strength|n/mm2|mpa"),
        ("Packing", r"\b(50\s?kg|bags?|bulk)\b"),
        QUANTITY,
    ],
    "Water & Plumbing": [
        ("Material", r"\b(upvc|pvc|hdpe|cpvc|gi|di|ms)\b"),
        ("Nominal diameter", r"\b\d+\s?mm\b|\bnb\b|\bod\b|\binch"),
        ("Pressure rating", r"\b\d+(\.\d+)?\s?(kgf/cm2|kg/cm2|bar|mpa)\b|\bpn\s?\d+|class\s?\d|sdr\s?\d+"),
        ("Length per pipe", r"\b\d+\s?m(etre)?\s?(length|long)\b|\b6\s?m\b"),
        QUANTITY,
    ],
    "Food & Water": [
        ("Pack size", r"\b\d+(\.\d+)?\s?(ml|litres?|ltrs?|l)\b"),
        ("Container type", r"\b(bottles?|jars?|pouch(es)?|cans?)\b"),
        ("Shelf life / batch", r"shelf life|best before|batch"),
        QUANTITY,
    ],
    "Appliances": [
        ("Capacity", r"\b\d+(\.\d+)?\s?(litres?|ltrs?|l|tons?|tr)\b"),
        ("Power rating", r"\b\d+(\.\d+)?\s?(k?w|watt)\b"),
        ("Energy star rating (BEE)", r"\b\d\s?star\b|\bbee\b|energy"),
        ("Supply voltage", r"\b2[23]0\s?v\b|single phase|three phase"),
        QUANTITY,
    ],
    "Electronics & IT": [
        ("Processor / performance", r"\b(i[3579]|ryzen|ghz|core)\b"),
        ("Memory", r"\b\d+\s?gb\b.*ram|\bram\b"),
        ("Storage", r"\b\d+\s?(gb|tb)\b.*(ssd|hdd)|\bssd\b|\bhdd\b"),
        ("Display size", r"\b\d+(\.\d+)?\s?(inch|\")"),
        ("Warranty", r"warranty|\bamc\b"),
        QUANTITY,
    ],
    "Renewable Energy": [
        ("Capacity (Wp / kW)", r"\b\d+(\.\d+)?\s?(wp|kwp|kw)\b"),
        ("Module technology", r"mono|poly|perc|bifacial|topcon"),
        ("Efficiency", r"efficiency|\d+(\.\d+)?\s?%"),
        ("Grid type", r"on[- ]?grid|off[- ]?grid|hybrid"),
        QUANTITY,
    ],
    "Safety & PPE": [
        ("Size / type", r"\b(full face|open face|half face|size|small|medium|large|abc|co2|dcp|foam)\b"),
        ("Capacity / rating", r"\b\d+(\.\d+)?\s?kg\b|rating"),
        ("Colour / marking", r"colou?r|reflective|marking"),
        QUANTITY,
    ],
    "Precious Metals": [
        ("Fineness (carat)", r"\b\d{2}\s?(k|kt|carat|karat)\b|\b(916|750|585|999|925)\b"),
        ("Weight", r"\b\d+(\.\d+)?\s?(g|gm|gram|grams)\b"),
        ("Hallmark / HUID", r"hallmark|huid"),
        QUANTITY,
    ],
    "Furniture & Office": [
        ("Material", r"\b(steel|wood|wooden|mesh|leather|fabric|ply|mdf)\b"),
        ("Dimensions", r"\b\d+\s?(mm|cm)\b|\d+\s?x\s?\d+"),
        ("Features", r"\b(revolving|adjustable|armrest|lumbar|gsm|a4)\b"),
        QUANTITY,
    ],
    "Gas & Fuel": [
        ("Burners / capacity", r"\b\d\s?burner|\b\d+(\.\d+)?\s?kg\b"),
        ("Body material", r"stainless|glass|ms\b|mild steel"),
        QUANTITY,
    ],
    "Automotive": [
        ("Tyre size", r"\b\d{3}/\d{2}\s?r\s?\d{2}\b"),
        ("Construction", r"radial|bias|tubeless|tube type"),
        ("Load / speed index", r"load index|speed (index|rating)|\b\d{2,3}[hvtw]\b"),
        QUANTITY,
    ],
}


def check_parameters(category: str, text: str) -> dict:
    """Return each key parameter for the category with whether the text states it."""
    params = CATEGORY_PARAMETERS.get(category, [QUANTITY])
    lowered = text.lower()
    rows = []
    for label, pattern in params:
        match = re.search(pattern, lowered, re.I)
        rows.append({"name": label, "present": bool(match), "value": match.group(0).strip() if match else None})
    stated = sum(1 for r in rows if r["present"])
    return {"category": category, "items": rows, "stated": stated, "total": len(rows), "completeness": round(100 * stated / len(rows))}
