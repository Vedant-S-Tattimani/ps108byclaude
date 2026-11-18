import { useState } from "react";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { api } from "../api";
import { useT } from "../i18n";
import type { CertificateCheck } from "../types";
import { Pin } from "./art/Doodles";
import { ErrorBox } from "./ui";

/** Checks the format of a licence / R-number / HUID a bidder quotes and points to official verification. */
export function CertificateChecker() {
  const t = useT();
  const [number, setNumber] = useState("");
  const [result, setResult] = useState<CertificateCheck | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    setError(null);
    try {
      setResult(await api.certificate(number));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Check failed.");
    }
  };

  return (
    <section className="paper pad-lg tilt-l" style={{ marginTop: 34 }} aria-labelledby="cert-check-h" data-testid="certificate-checker">
      <Pin colour="#2f6fca" />
      <span className="eyebrow">Bid evaluation helper</span>
      <h2 id="cert-check-h" style={{ font: "900 22px/1.1 var(--font-display)", textTransform: "uppercase" }}>{t("Verify a certificate number")}</h2>
      <p className="muted" style={{ fontSize: 13.5 }}>Paste the ISI licence (CM/L), CRS R-number or HUID a bidder quoted. We check the format and show where to confirm it officially.</p>
      <form className="input-tools" onSubmit={(e) => { e.preventDefault(); if (number.trim().length >= 3) check(); }}>
        <label className="visually-hidden" htmlFor="cert-number">Certificate number</label>
        <input id="cert-number" className="input" style={{ flex: "1 1 200px" }} placeholder="CM/L-7600012345" value={number} onChange={(e) => setNumber(e.target.value)} />
        <button type="submit" className="btn btn-ink" disabled={number.trim().length < 3}><BadgeCheck size={16} /> Check</button>
      </form>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="cert-result" role="status">
          <span className={`stamp ${result.valid_format ? "green" : ""}`}>{result.valid_format ? "Format OK" : "Check again"}</span>
          <div>
            <b>{result.type}</b> · <span className="mono">{result.number}</span>
            <p style={{ margin: "4px 0 6px" }}>{result.how_to_verify}</p>
            <a href={result.links[0]} target="_blank" rel="noopener noreferrer">BIS Care app <ExternalLink size={12} /></a>
            {" · "}
            <a href={result.links[1]} target="_blank" rel="noopener noreferrer">Manak Online <ExternalLink size={12} /></a>
          </div>
        </div>
      )}
    </section>
  );
}
