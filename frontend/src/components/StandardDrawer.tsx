import { useEffect, useRef, useState } from "react";
import { ExternalLink, Star, X } from "lucide-react";
import { useWatchlist } from "../hooks/useWatchlist";
import { useT } from "../i18n";
import { api } from "../api";
import type { StandardDetail } from "../types";
import { CertBadge, ErrorBox, KindTag, VersionTag } from "./ui";

type Props = {
  id: string;
  onClose: () => void;
  onOpen: (id: string) => void;
};

const RELATION_NAMES: Record<string, string> = {
  normative: "Normative reference",
  test_method: "Test method",
  terminology: "Terminology",
  safety: "Safety",
  installation: "Installation / code of practice",
  related_product: "Related product",
  sampling: "Sampling",
};

export function StandardDrawer({ id, onClose, onOpen }: Props) {
  const [detail, setDetail] = useState<StandardDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { isWatched, toggle } = useWatchlist();
  const t = useT();

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setError(null);
    api
      .standard(id)
      .then((d) => !cancelled && setDetail(d))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : "Could not load the standard."));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Standard details">
        <div className="drawer-head">
          <div>
            <span className="eyebrow">{detail?.category ?? "Loading"}</span>
            <h2 className="mono" style={{ fontSize: 22 }}>{detail?.designation ?? "…"}</h2>
          </div>
          <button ref={closeRef} type="button" className="btn btn-paper" onClick={onClose} aria-label="Close details">
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">
          {error && <ErrorBox message={error} />}
          {!detail && !error && <div className="skeleton" />}
          {detail && (
            <>
              <div>
                <h3 style={{ fontSize: 17, lineHeight: 1.35 }}>{detail.title}</h3>
                <p className="muted" style={{ marginBottom: 0 }}>{detail.scope}</p>
              </div>
              <div className="drawer-actions">
                <button type="button" className={`btn ${isWatched(detail.id) ? "btn-ink" : "btn-paper"}`} aria-pressed={isWatched(detail.id)} onClick={() => toggle(detail.id)}>
                  <Star size={16} fill={isWatched(detail.id) ? "currentColor" : "none"} /> {isWatched(detail.id) ? t("Watching") : t("Watch for changes")}
                </button>
                <a className="btn btn-paper" href={detail.official_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={16} /> {t("Open on BIS")}
                </a>
              </div>
              <div className="rec-meta" style={{ marginTop: 0 }}>
                <VersionTag standard={detail} />
                <CertBadge cert={detail.certification} />
                <KindTag kind={detail.kind} />
                <span className="tag">ICS {detail.ics}</span>
              </div>
              <div>
                <span className="eyebrow">Version history</span>
                <div className="timeline">
                  {detail.previous_versions.map((y) => (
                    <span key={y} className="old mono">{detail.number}:{y}</span>
                  ))}
                  {detail.previous_versions.length > 0 && <span aria-hidden>→</span>}
                  <span className="tag ok mono">{detail.designation}</span>
                  {detail.amendments.map((a) => (
                    <span key={a.no} className="tag">Amd {a.no} · {a.year}</span>
                  ))}
                </div>
              </div>
              {detail.certification.instrument && (
                <div>
                  <span className="eyebrow">Certification instrument</span>
                  <p style={{ margin: 0 }}>{detail.certification.instrument}</p>
                </div>
              )}
              <RelationList title="This standard refers to" items={detail.relations} onOpen={onOpen} />
              <RelationList title="Referred to by" items={detail.referenced_by} onOpen={onOpen} />
              <p className="muted" style={{ fontSize: 12, margin: 0 }}>
                Prototype data. Confirm the current version and amendments on the BIS Standards portal before issuing a tender.
              </p>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function RelationList({ title, items, onOpen }: { title: string; items: StandardDetail["relations"]; onOpen: (id: string) => void }) {
  if (!items.length) return null;
  return (
    <div>
      <span className="eyebrow">{title}</span>
      {items.map((r) => (
        <button type="button" className="allied-item" key={`${r.id}-${r.relation}`} onClick={() => onOpen(r.id)}>
          <span className="mono">{r.designation}</span>
          <span>{r.title}</span>
          <small>{RELATION_NAMES[r.relation] ?? r.relation}</small>
        </button>
      ))}
    </div>
  );
}
