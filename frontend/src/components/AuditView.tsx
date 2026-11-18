import { useState } from "react";
import { AlertOctagon, CheckCircle2, Info, ShieldCheck, TriangleAlert } from "lucide-react";
import { api } from "../api";
import type { AuditResult, Severity } from "../types";
import { Pin } from "./art/Doodles";
import { ErrorBox } from "./ui";

const SAMPLE = `Supply of PVC insulated copper conductor house wiring cables, 1.5 sq mm and 2.5 sq mm, 1100 V grade.
Cables shall conform to IS 694:1990 and conductors to IS 8130.
Tests shall be carried out as per IS 10810.
Delivery within 30 days of purchase order.`;

const ICONS: Record<Severity, typeof Info> = { high: AlertOctagon, medium: TriangleAlert, low: Info, ok: CheckCircle2 };
const COLOURS: Record<Severity, string> = { high: "var(--bad)", medium: "var(--warn)", low: "var(--info)", ok: "var(--ok)" };

type Props = { onOpen: (id: string) => void };

export function AuditView({ onOpen }: Props) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const run = async (input: string) => {
    setIsBusy(true);
    setError(null);
    try {
      setResult(await api.audit(input));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Audit failed.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="workspace">
      <div className="paper pad-lg sticky" data-reveal>
        <Pin />
        <span className="eyebrow">Specification health check</span>
        <label className="field-label" htmlFor="audit-text">Paste a draft tender specification</label>
        <textarea id="audit-text" className="query" style={{ minHeight: 240 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the technical specification section of your tender…" />
        <div className="input-tools">
          <button type="button" className="btn btn-ink" style={{ flex: 1 }} disabled={isBusy || text.trim().length < 10} onClick={() => run(text)}>
            <ShieldCheck size={16} /> {isBusy ? "Checking…" : "Check specification"}
          </button>
          <button type="button" className="btn btn-paper" onClick={() => { setText(SAMPLE); run(SAMPLE); }}>
            Load sample
          </button>
        </div>
        <p className="muted" style={{ fontSize: 12.5, marginBottom: 0 }}>
          Flags outdated or undated IS references, applicable standards you missed, mandatory BIS certification, test methods and sampling plans.
        </p>
      </div>

      <div className="stack">
        {error && <ErrorBox message={error} />}
        {isBusy && <div className="skeleton" />}
        {!result && !isBusy && (
          <div className="paper empty-state">
            <h2>Catch tender gaps before they become disputes</h2>
            <p>Outdated references and missing certification clauses are among the most common grounds for bidder queries. Paste a specification or load the sample.</p>
          </div>
        )}
        {result && !isBusy && (
          <>
            <div className="paper pad-lg audit-head tilt-r" data-reveal style={{ ["--r-to" as string]: "1.4deg" }}>
              <Pin />
              <span className="fold" />
              <Gauge score={result.score} grade={result.grade} />
              <div>
                <h2 style={{ fontSize: 22 }}>
                  {result.score >= 85 ? "Ready to publish" : result.score >= 65 ? "Minor fixes needed" : "Needs revision before publishing"}
                </h2>
                <div className="rec-meta">
                  <span className="tag bad">{result.counts.high} critical</span>
                  <span className="tag warn">{result.counts.medium} to improve</span>
                  <span className="tag info">{result.counts.low} advisory</span>
                  <span className="tag ok">{result.counts.ok} current</span>
                </div>
              </div>
            </div>
            <section className="stack" aria-label="Findings">
              {result.findings.map((f, i) => {
                const Icon = ICONS[f.severity];
                return (
                  <div className={`finding paper hoverable ${f.severity}`} key={`${f.title}-${i}`} data-reveal style={{ ["--d" as string]: `${i * 80}ms`, ["--r-from" as string]: i % 2 ? "4deg" : "-4deg" }}>
                    <Icon size={20} color={COLOURS[f.severity]} aria-hidden />
                    <div>
                      <h3>{f.title}</h3>
                      <p>{f.detail}</p>
                      {f.fix && <div className="fix">Fix: {f.fix}</div>}
                    </div>
                  </div>
                );
              })}
            </section>
            {result.suggested.length > 0 && (
              <section className="paper pad">
                <span className="eyebrow">Standards this text describes</span>
                {result.suggested.map((s) => (
                  <button type="button" className="allied-item" key={s.id} onClick={() => onOpen(s.id)}>
                    <span className="mono">{s.designation}</span>
                    <span>{s.title}</span>
                    <small>{s.confidence}% match</small>
                  </button>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Gauge({ score, grade }: { score: number; grade: string }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const colour = score >= 85 ? "var(--ok)" : score >= 65 ? "var(--accent)" : "var(--bad)";
  return (
    <div className="gauge" role="img" aria-label={`Specification score ${score} out of 100, grade ${grade}`}>
      <svg width="132" height="132" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="66" cy="66" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
        <circle cx="66" cy="66" r={r} fill="none" stroke={colour} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} style={{ transition: "stroke-dashoffset 1s var(--ease)" }} />
      </svg>
      <b>{score}</b>
      <small>Grade {grade}</small>
    </div>
  );
}
