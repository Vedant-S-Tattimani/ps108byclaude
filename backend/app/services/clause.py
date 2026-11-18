"""Drafts a ready-to-paste tender specification clause from a recommendation result."""
from __future__ import annotations


def _amendments(item: dict) -> str:
    last = item.get("latest_amendment")
    return f" read with Amendment No. {last['no']} ({last['year']})" if last else ""


def draft_clause(product: str, result: dict, checklist: dict | None = None) -> str:
    recs = result["recommendations"]
    if not recs:
        return ""
    main = recs[0]
    lines = [
        f"TECHNICAL SPECIFICATION - {product.strip()[:80].upper()}",
        "",
        "1. Standard of conformity",
        f"   1.1 The item shall conform to {main['designation']} '{main['title']}'{_amendments(main)}, "
        "including all amendments and revisions in force on the date of bid opening.",
    ]
    sub = 2
    for extra in recs[1:3]:
        if extra["confidence"] >= 60 and extra["category"] == main["category"]:
            lines.append(f"   1.{sub} Where applicable, the item shall also conform to {extra['designation']} '{extra['title']}'.")
            sub += 1

    certs = [c for c in result["certifications"] if c["mandatory"]]
    lines += ["", "2. Certification"]
    if certs:
        merged: dict[tuple[str, str], list[dict]] = {}
        for cert in certs:
            merged.setdefault((cert["scheme"], cert["instrument"]), []).append(cert)
        for i, ((scheme, instrument), group) in enumerate(merged.items(), 1):
            covered = ", ".join(c["standard"] for c in group)
            lines.append(f"   2.{i} {scheme} certification is mandatory for {covered} under the {instrument}. {group[0]['guidance']}")
    else:
        lines.append("   2.1 Products bearing the BIS Standard Mark (ISI) shall be preferred. Test reports from a BIS-recognised / NABL-accredited laboratory shall be submitted.")

    clause_no = 3
    group_titles = {
        "normative": "Materials and components",
        "safety": "Safety",
        "test_method": "Testing",
        "installation": "Installation and workmanship",
        "sampling": "Sampling and acceptance",
        "terminology": "Definitions",
    }
    for group in result["allied"]:
        title = group_titles.get(group["type"])
        if not title:
            continue
        refs = ", ".join(i["designation"] for i in group["items"][:4])
        verb = {
            "normative": "Materials and components shall comply with",
            "safety": "The item shall meet the safety requirements of",
            "test_method": "Type, routine and acceptance tests shall be carried out as per",
            "installation": "Installation, erection and commissioning shall follow",
            "sampling": "Sampling and lot acceptance shall be as per",
            "terminology": "Terms used shall have the meanings given in",
        }[group["type"]]
        lines += ["", f"{clause_no}. {title}", f"   {clause_no}.1 {verb} {refs}."]
        clause_no += 1

    if checklist:
        lines += ["", f"{clause_no}. Key parameters (to be stated by the buyer)"]
        for i, item in enumerate(checklist["items"], 1):
            value = item["value"] if item["present"] else "________"
            lines.append(f"   {clause_no}.{i} {item['name']}: {value}")
        clause_no += 1

    lines += [
        "",
        f"{clause_no}. General",
        f"   {clause_no}.1 Where a referenced standard is revised, the latest version with amendments shall apply.",
        f"   {clause_no}.2 The bidder shall submit a clause-by-clause compliance statement against the above standards.",
    ]
    return "\n".join(lines)
