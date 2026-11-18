import { useEffect, useRef } from "react";

/* Hand-drawn SVG stickers for the case-file look. All original artwork. */

export function Pin({ className = "pin", colour = "var(--pin)" }: { className?: string; colour?: string }) {
  return (
    <svg className={className} viewBox="0 0 26 30" aria-hidden>
      <ellipse cx="13" cy="10" rx="10" ry="9.5" fill={colour} />
      <ellipse cx="9.5" cy="7" rx="3.2" ry="2.4" fill="#fff" opacity="0.55" />
      <path d="M13 19 L13.6 29" stroke="#7a7a7a" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Clip({ className = "clip" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 54" aria-hidden>
      <path d="M6 14 V40 a4 4 0 0 0 8 0 V8 a6 6 0 0 0 -12 0 V42 a8 8 0 0 0 16 0 V16" fill="none" stroke="#4d7fd1" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Scribble({ colour = "#f5c542", width = 130 }: { colour?: string; width?: number }) {
  return (
    <svg width={width} viewBox="0 0 130 24" aria-hidden>
      <path d="M3 14c6-9 9 9 15 0s9 9 15 0 9 9 15 0 9 9 15 0M78 18c6-9 9 9 15 0s9 9 15 0 9 9 15 0" fill="none" stroke={colour} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Chevrons({ colour = "var(--sky)" }: { colour?: string }) {
  const rows = [0, 1, 2, 3];
  return (
    <svg width="96" height="92" viewBox="0 0 96 92" aria-hidden>
      {rows.map((r) =>
        [0, 1, 2].map((c) => (
          <path key={`${r}-${c}`} d={`M${8 + c * 28 + (r % 2) * 12} ${10 + r * 21}q7 10 14 0`} fill="none" stroke={colour} strokeWidth="5" strokeLinecap="round" />
        )),
      )}
    </svg>
  );
}

export function HatchedSeal({ colour = "var(--saffron)" }: { colour?: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden>
      <defs>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
          <rect width="6" height="6" fill={colour} />
          <line x1="0" y1="0" x2="0" y2="6" stroke="#fff" strokeWidth="2" opacity="0.6" />
        </pattern>
      </defs>
      <circle cx="22" cy="22" r="18" fill="url(#hatch)" stroke="#2b2b2b" strokeWidth="2.5" />
    </svg>
  );
}

export function LoopMark({ colour = "var(--lime)" }: { colour?: string }) {
  return (
    <svg width="170" height="150" viewBox="0 0 170 150" className="draw-path" aria-hidden>
      <path d="M20 60c40-40 120-50 120-10S40 120 30 100s60-60 110-40 10 70-50 70" fill="none" stroke={colour} strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowCursor() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
      <path d="M6 4l26 12-11 3 7 13-5 3-7-13-8 8z" fill="#5aa0e8" stroke="#2b2b2b" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}

export function Pencil() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden>
      <g transform="rotate(40 22 22)">
        <rect x="17" y="3" width="10" height="28" rx="2" fill="#7bc77d" stroke="#2b2b2b" strokeWidth="2" />
        <path d="M17 31h10l-5 10z" fill="#f6d7a7" stroke="#2b2b2b" strokeWidth="2" strokeLinejoin="round" />
        <rect x="17" y="3" width="10" height="5" fill="#f08a8a" stroke="#2b2b2b" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function Bulb() {
  return (
    <svg width="36" height="44" viewBox="0 0 36 44" aria-hidden>
      <path d="M18 3a13 13 0 0 0-7 24v5h14v-5a13 13 0 0 0-7-24z" fill="#ffb26b" stroke="#2b2b2b" strokeWidth="2.2" />
      <path d="M13 36h10M14 40h8" stroke="#2b2b2b" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 18l4 5 4-5" fill="none" stroke="#2b2b2b" strokeWidth="1.8" />
    </svg>
  );
}

export function Cloud() {
  return (
    <svg width="60" height="34" viewBox="0 0 60 34" aria-hidden>
      <path d="M12 30a9 9 0 0 1 0-18 12 12 0 0 1 22-5 10 10 0 0 1 16 8 8 8 0 0 1-2 15z" fill="#6f8fc4" stroke="#2b2b2b" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M16 18a6 6 0 0 1 6-4" fill="none" stroke="#fff" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
    </svg>
  );
}

export function Plane() {
  return (
    <svg width="54" height="40" viewBox="0 0 54 40" aria-hidden>
      <path d="M3 18L51 3 36 37 26 24z" fill="#fff" stroke="#2b2b2b" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M26 24L51 3M26 24l-3 12 7-8" fill="none" stroke="#2b2b2b" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function Burst({ colour = "#f26d5b" }: { colour?: string }) {
  const points = Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 ? 9 : 16;
    const a = (i / 16) * Math.PI * 2;
    return `${18 + Math.cos(a) * r},${18 + Math.sin(a) * r}`;
  }).join(" ");
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
      <polygon points={points} fill={colour} stroke="#2b2b2b" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function Highlight({ colour = "var(--lime)" }: { colour?: string }) {
  return (
    <svg viewBox="0 0 300 40" preserveAspectRatio="none" className="draw-path" aria-hidden>
      <path d="M6 26c80-14 200-18 288-8" fill="none" stroke={colour} strokeWidth="16" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

/** Two googly eyes whose pupils follow the pointer. */
export function GooglyEyes() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      el.querySelectorAll<HTMLElement>(".pupil").forEach((pupil) => {
        const eye = pupil.parentElement?.getBoundingClientRect();
        if (!eye) return;
        const dx = e.clientX - (eye.left + eye.width / 2);
        const dy = e.clientY - (eye.top + eye.height / 2);
        const angle = Math.atan2(dy, dx);
        const dist = Math.min(7, Math.hypot(dx, dy) / 30);
        pupil.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return (
    <div ref={ref} aria-hidden style={{ display: "flex", gap: 2 }}>
      {[0, 1].map((i) => (
        <span key={i} style={{ width: 34, height: 34, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", boxShadow: "0 3px 8px rgba(0,0,0,.18)", marginTop: i ? -6 : 0 }}>
          <span className="pupil" style={{ width: 13, height: 13, borderRadius: "50%", background: "#111", transition: "transform .12s ease-out" }} />
        </span>
      ))}
    </div>
  );
}
