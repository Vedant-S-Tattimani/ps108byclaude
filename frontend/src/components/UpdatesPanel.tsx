import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { api } from "../api";
import { useWatchlist } from "../hooks/useWatchlist";
import { useT } from "../i18n";
import type { UpdateRow } from "../types";
import { Pin } from "./art/Doodles";
import { ErrorBox } from "./ui";

const YEARS = [2024, 2020, 2016, 2012];

/** Revision and amendment feed, with the officer's watched standards pulled to the top. */
export function UpdatesPanel({ onOpen }: { onOpen: (id: string) => void }) {
  const t = useT();
  const { ids } = useWatchlist();
  const [since, setSince] = useState(2016);
  const [rows, setRows] = useState<UpdateRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onlyWatched, setOnlyWatched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .updates(since)
      .then((d) => !cancelled && (setRows(d), setError(null)))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : "Could not load updates."));
    return () => {
      cancelled = true;
    };
  }, [since]);

  const visible = (rows ?? []).filter((r) => !onlyWatched || ids.includes(r.id));
  const ordered = [...visible.filter((r) => ids.includes(r.id)), ...visible.filter((r) => !ids.includes(r.id))];

  return (
    <section className="paper pad-lg" style={{ marginBottom: 40 }} aria-labelledby="updates-h" data-testid="updates-panel">
      <Pin />
      <span className="fold saffron" />
      <div className="section-title" style={{ marginTop: 0 }}>
        <h2 id="updates-h"><BellRing size={20} style={{ verticalAlign: -3 }} /> {t("What changed")}</h2>
        <div className="actions">
          <label className="visually-hidden" htmlFor="since">Changes since</label>
          <select id="since" className="input" value={since} onChange={(e) => setSince(Number(e.target.value))}>
            {YEARS.map((y) => <option key={y} value={y}>Since {y}</option>)}
          </select>
          <button type="button" className={`chip ${onlyWatched ? "active" : ""}`} aria-pressed={onlyWatched} onClick={() => setOnlyWatched((v) => !v)}>
            My watchlist ({ids.length})
          </button>
        </div>
      </div>
      {error && <ErrorBox message={error} />}
      {rows && ordered.length === 0 && <p className="muted">{onlyWatched ? "No changes to your watched standards in this period. Watch a standard from its detail panel." : "No revisions or amendments in this period."}</p>}
      <ul className="updates">
        {ordered.slice(0, 12).map((r) => (
          <li key={r.id}>
            <button type="button" className="allied-item" onClick={() => onOpen(r.id)}>
              <span className="mono">{r.designation}</span>
              <span>{r.title}</span>
              <small>
                {ids.includes(r.id) && <b style={{ color: "var(--saffron)" }}>★ watching · </b>}
                {r.changes.map((c) => `${c.change} (${c.year})`).join(" · ")}
              </small>
            </button>
          </li>
        ))}
      </ul>
      {ordered.length > 12 && <p className="muted" style={{ fontSize: 13 }}>+{ordered.length - 12} more</p>}
    </section>
  );
}
