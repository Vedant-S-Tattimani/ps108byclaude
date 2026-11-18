import { useState } from "react";
import { AlertTriangle, Check, Copy, Download, FileSpreadsheet, Languages, Printer } from "lucide-react";
import type { RecommendResult } from "../types";
import { AlliedGraph, GROUP_COLOURS } from "./AlliedGraph";
import { Clip, Pin } from "./art/Doodles";
import { FeedbackBar } from "./FeedbackBar";
import { RecommendationCard } from "./RecommendationCard";
import { SpecChecklistCard } from "./SpecChecklistCard";
import { useT } from "../i18n";

type Props = {
  result: RecommendResult;
  onOpen: (id: string) => void;
};

function Understanding({ result }: { result: RecommendResult }) {
  const lang = result.language;
  return (
    <div className="paper pad understanding tilt-r" data-reveal="fade" style={{ background: "#fffbe0" }}>
      <span className="tape" />
      <div className="understanding-row">
        <span className="tag info">
          <Languages size={13} aria-hidden /> {lang.name}
        </span>
        <span className="muted" style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600 }}>
          {result.engine} · {result.elapsed_ms} ms
        </span>
      </div>
      {lang.code !== "en" && (
        <div className="understanding-row">
          <span className="hand">read as →</span> <b>“{lang.english_query}”</b>
        </div>
      )}
      {result.concepts_detected.length > 0 && (
        <div className="understanding-row">
          <span className="muted" style={{ fontWeight: 700 }}>Concepts</span>
          {result.concepts_detected.map((c) => (
            <span key={c} className="tag accent">{c}</span>
          ))}
        </div>
      )}
      {result.parameters.length > 0 && (
        <div className="understanding-row">
          <span className="muted" style={{ fontWeight: 700 }}>Parameters</span>
          {result.parameters.map((p) => (
            <span key={`${p.type}-${p.value}`} className="tag">
              {p.type}: <b className="mono">{p.value}</b>
            </span>
          ))}
        </div>
      )}
      {lang.untranslated.length > 0 && (
        <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>
          Not in the offline glossary: {lang.untranslated.join(", ")}. Add an NVIDIA API key in the backend to translate any language with Nemotron.
        </p>
      )}
    </div>
  );
}

const SCHEME_TITLE: Record<string, string> = {
  ISI: "BIS Standard Mark (ISI)",
  CRS: "Compulsory Registration Scheme",
  Hallmarking: "BIS Hallmarking with HUID",
};

function Certifications({ result }: { result: RecommendResult }) {
  const mandatory = result.certifications.filter((c) => c.mandatory);
  const list = mandatory.length ? mandatory : result.certifications;
  const t = useT();
  if (!list.length) return null;
  return (
    <section className="stack" aria-labelledby="cert-h">
      <div className="section-title">
        <h2 id="cert-h">{t("Certification to demand")}</h2>
      </div>
      {list.map((c, i) => (
        <div className="paper cert hoverable" key={c.standard_id} data-reveal style={{ ["--d" as string]: `${i * 100}ms` }}>
          <Pin className="pin right" colour="#ff7a1a" />
          <span className={`stamp big thump ${c.mandatory ? "" : "navy"}`} style={{ ["--d" as string]: `${0.5 + i * 0.15}s` }}>
            {c.mandatory ? "Mandatory" : "Voluntary"}
          </span>
          <div>
            <h3>
              {SCHEME_TITLE[c.scheme]} · <span className="mono">{c.standard}</span>
            </h3>
            <p><b>{c.mandatory ? "Required by:" : "Status:"}</b> {c.instrument || "Voluntary certification"}</p>
            <p>{c.guidance}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

function Allied({ result, onOpen }: Props) {
  const t = useT();
  if (!result.allied.length) return null;
  const total = result.allied.reduce((n, g) => n + g.items.length, 0);
  return (
    <section className="paper pad-lg" data-reveal aria-labelledby="allied-h">
      <Pin className="pin center" colour="#2f6fca" />
      <div className="section-title">
        <h2 id="allied-h">{t("Allied standards")}</h2>
        <span className="hand" style={{ fontSize: 22, color: "var(--info)" }}>{total} linked to cite alongside</span>
      </div>
      <div className="allied-grid">
        <AlliedGraph hub={result.recommendations[0].designation} groups={result.allied} onOpen={onOpen} />
        <div className="allied-list">
          {result.allied.map((g) => (
            <div className="allied-group" key={g.type}>
              <h3>
                <i className="swatch" style={{ background: GROUP_COLOURS[g.type] }} /> {g.label}
              </h3>
              {g.items.map((item) => (
                <button type="button" className="allied-item" key={item.id} onClick={() => onOpen(item.id)}>
                  <span className="mono">{item.designation}</span>
                  <span>{item.title}</span>
                  <small>via {item.via}</small>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Clause-by-clause compliance statement bidders fill in (opens in Excel). */
function complianceSheet(result: RecommendResult): string {
  const rows: string[][] = [["Sl", "Requirement", "Reference", "Bidder response (Complied / Not complied)", "Deviation, if any", "Supporting document"]];
  const add = (requirement: string, reference: string) => rows.push([String(rows.length), requirement, reference, "", "", ""]);
  const main = result.recommendations[0];
  if (main) add(`Conformity to ${main.title}`, `${main.designation} with latest amendments`);
  result.certifications.filter((c) => c.mandatory).forEach((c) => add(`${c.scheme} certification - valid licence / registration number`, `${c.standard}; ${c.instrument}`));
  result.allied.forEach((g) => g.items.forEach((i) => add(`${g.label}: ${i.title}`, i.designation)));
  result.spec_checklist?.items.forEach((i) => add(`Key parameter - ${i.name}`, i.present && i.value ? i.value : "to be stated"));
  const BOM = "﻿"; // lets Excel open the UTF-8 file with Hindi text intact
  return BOM + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

function saveFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Clause({ clause, result }: { clause: string; result: RecommendResult }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(clause);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  const download = () => saveFile("tender-technical-specification.txt", clause, "text/plain;charset=utf-8");
  return (
    <section className="paper pad-lg tilt-l" data-reveal aria-labelledby="clause-h" style={{ ["--r-to" as string]: "-1.6deg" }}>
      <Clip />
      <div className="section-title" style={{ marginBottom: 14 }}>
        <h2 id="clause-h">{t("Draft tender clause")}</h2>
        <div className="actions">
          <button type="button" className="btn btn-ink" onClick={copy}>
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : t("Copy clause")}
          </button>
          <button type="button" className="btn btn-paper" onClick={() => saveFile("bidder-compliance-sheet.csv", complianceSheet(result), "text/csv;charset=utf-8")}>
            <FileSpreadsheet size={16} /> {t("Compliance sheet")}
          </button>
          <button type="button" className="btn btn-paper" onClick={download}>
            <Download size={16} /> .txt
          </button>
          <button type="button" className="btn btn-paper" onClick={() => window.print()} aria-label="Print the results">
            <Printer size={16} />
          </button>
        </div>
      </div>
      <pre className="clause">{clause}</pre>
    </section>
  );
}

export function ResultsView({ result, onOpen }: Props) {
  const t = useT();
  return (
    <div className="stack" style={{ gap: 30 }}>
      <Understanding result={result} />
      {result.low_confidence && (
        <div className="error-box" role="status" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <AlertTriangle size={18} aria-hidden /> No confident match. Add the material, use or rating, or check the BIS portal directly.
        </div>
      )}
      <section className="stack" style={{ gap: 30 }} aria-labelledby="rec-h">
        <div className="section-title">
          <h2 id="rec-h">{t("Recommended standards")}</h2>
          <span className="hand" style={{ fontSize: 22, color: "var(--info)" }}>tap a card for its reference map</span>
        </div>
        {result.recommendations.map((rec) => (
          <div key={`${result.query}-${rec.id}`} className="stack" style={{ gap: 0 }}>
            <RecommendationCard rec={rec} onOpen={onOpen} />
            {rec.rank <= 3 && <FeedbackBar query={result.query} standardId={rec.id} />}
          </div>
        ))}
      </section>
      <Certifications result={result} />
      {result.spec_checklist && <SpecChecklistCard checklist={result.spec_checklist} />}
      <Allied result={result} onOpen={onOpen} />
      <Clause clause={result.clause} result={result} />
    </div>
  );
}
