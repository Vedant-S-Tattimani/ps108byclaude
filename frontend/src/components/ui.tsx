import { BadgeCheck, Gem, ShieldCheck } from "lucide-react";
import type { Certification, StandardSummary } from "../types";

export function ConfidenceRing({ value, size = 72 }: { value: number; size?: number }) {
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const colour = value >= 75 ? "var(--ok)" : value >= 45 ? "var(--saffron)" : "var(--muted)";
  return (
    <div role="img" aria-label={`Match confidence ${value} percent`}>
      <div className="ring" style={{ width: size, height: size, ["--c" as string]: `${circumference}` }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="#fffbe0" stroke="var(--paper-2)" strokeWidth="7" />
        <circle
          className="val"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colour}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
        />
      </svg>
      <b>{value}</b>
      </div>
      <small className="ring-label">match</small>
    </div>
  );
}

const SCHEME_LABEL: Record<string, string> = {
  ISI: "ISI mark",
  CRS: "CRS registration",
  Hallmarking: "Hallmark + HUID",
};

export function CertBadge({ cert }: { cert: Certification }) {
  if (cert.scheme === "None") return <span className="tag">No product certification</span>;
  const Icon = cert.scheme === "Hallmarking" ? Gem : cert.scheme === "CRS" ? BadgeCheck : ShieldCheck;
  return (
    <span className={`tag ${cert.mandatory ? "accent" : "info"}`}>
      <Icon size={13} aria-hidden />
      {SCHEME_LABEL[cert.scheme]} {cert.mandatory ? "mandatory" : "voluntary"}
    </span>
  );
}

export function VersionTag({ standard }: { standard: StandardSummary }) {
  const last = standard.latest_amendment;
  return (
    <span className="tag ok">
      Latest: {standard.year}
      {last ? ` · Amd ${last.no} (${last.year})` : ""}
    </span>
  );
}

export function KindTag({ kind }: { kind: string }) {
  const labels: Record<string, string> = {
    product: "Product specification",
    test_method: "Test method",
    code_of_practice: "Code of practice",
    terminology: "Terminology",
    sampling: "Sampling",
  };
  return <span className="tag">{labels[kind] ?? kind}</span>;
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="error-box" role="alert">
      {message}
    </div>
  );
}
