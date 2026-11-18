import type { Recommendation } from "../types";
import { Pin } from "./art/Doodles";
import { CertBadge, ConfidenceRing, KindTag, VersionTag } from "./ui";

type Props = {
  rec: Recommendation;
  onOpen: (id: string) => void;
};

const SIGNALS: { key: keyof Recommendation["signals"]; label: string }[] = [
  { key: "concept", label: "Concept match" },
  { key: "semantic", label: "Semantic" },
  { key: "lexical", label: "Lexical" },
  { key: "fuzzy", label: "Spelling-tolerant" },
];

const PIN_COLOURS = ["var(--pin)", "#2f6fca", "#1c7c4a", "#ff7a1a", "#7a7a7a"];

export function RecommendationCard({ rec, onOpen }: Props) {
  const superseded = rec.previous_versions.length ? `Supersedes ${rec.previous_versions.join(", ")}` : null;
  const isTop = rec.rank === 1;
  return (
    <button
      type="button"
      className={`rec paper hoverable ${isTop ? "top" : ""}`}
      data-reveal
      style={{ ["--d" as string]: `${(rec.rank - 1) * 110}ms`, ["--r-from" as string]: rec.rank % 2 ? "-6deg" : "5deg" }}
      onClick={() => onOpen(rec.id)}
      aria-label={`Open details for ${rec.designation}`}
    >
      <Pin colour={PIN_COLOURS[(rec.rank - 1) % PIN_COLOURS.length]} />
      {isTop && <span className="fold" />}
      {isTop && <span className="stamp green big thump">Best match</span>}
      <ConfidenceRing value={rec.confidence} />
      <div>
        <div className="rec-head">
          <span className="mono designation">{rec.designation}</span>
          <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{rec.category}</span>
        </div>
        <h3>{rec.title}</h3>
        <p className="scope">{rec.scope}</p>
        <div className="rec-meta">
          <VersionTag standard={rec} />
          {superseded && <span className="tag">{superseded}</span>}
          <CertBadge cert={rec.certification} />
          <KindTag kind={rec.kind} />
        </div>
        <ul className="reasons">
          {rec.reasons.slice(0, 3).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <div className="signals" aria-label="Scoring signals">
          {SIGNALS.map((s) => (
            <div className="signal" key={s.key}>
              <span>{s.label}</span>
              <div className="bar">
                <i style={{ width: `${Math.min(100, Math.round(rec.signals[s.key] * 100))}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}
