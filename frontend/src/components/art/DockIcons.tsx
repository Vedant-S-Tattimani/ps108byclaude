/* Illustrated, full-colour dock icons (original artwork, 48×48 grid). */

type IconProps = { size?: number };

/** Find standards: a magnifying glass over a standards sheet stamped "IS". */
export function FindIcon({ size = 34 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="fi-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9eef5" />
        </linearGradient>
        <linearGradient id="fi-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb347" />
          <stop offset="1" stopColor="#f2711c" />
        </linearGradient>
        <radialGradient id="fi-lens" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#e6f6ff" />
          <stop offset="0.6" stopColor="#9fd5ff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#5aa9e6" stopOpacity="0.9" />
        </radialGradient>
        <linearGradient id="fi-handle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4a4a4a" />
          <stop offset="1" stopColor="#151515" />
        </linearGradient>
      </defs>
      <rect x="6" y="5" width="26" height="33" rx="4" fill="url(#fi-paper)" stroke="#c9d3df" strokeWidth="1.2" />
      <rect x="10" y="10" width="12" height="2.6" rx="1.3" fill="#2f6fca" />
      <rect x="10" y="15.5" width="17" height="2" rx="1" fill="#c3cddb" />
      <rect x="10" y="20" width="14" height="2" rx="1" fill="#c3cddb" />
      <rect x="10" y="24.5" width="9" height="2" rx="1" fill="#c3cddb" />
      <g transform="rotate(-10 15 32)">
        <rect x="8.5" y="28.5" width="12" height="7" rx="1.6" fill="none" stroke="#1c7c4a" strokeWidth="1.4" />
        <text x="14.5" y="34" textAnchor="middle" fontFamily="Archivo, sans-serif" fontWeight="900" fontSize="5.6" fill="#1c7c4a">IS</text>
      </g>
      <path d="M35.5 35.5l7 7" stroke="url(#fi-handle)" strokeWidth="6" strokeLinecap="round" />
      <path d="M36.5 36.5l5 5" stroke="#6a6a6a" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      <circle cx="30" cy="30" r="10.5" fill="url(#fi-rim)" />
      <circle cx="30" cy="30" r="7.6" fill="url(#fi-lens)" />
      <path d="M25.6 27.4a5.4 5.4 0 0 1 4.6-3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9" />
    </svg>
  );
}

/** Spec audit: a clipboard with a checked list and a green tick badge. */
export function AuditIcon({ size = 34 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="au-board" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d79b5c" />
          <stop offset="1" stopColor="#a8682f" />
        </linearGradient>
        <linearGradient id="au-clip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1f4f8" />
          <stop offset="1" stopColor="#9aa6b5" />
        </linearGradient>
        <linearGradient id="au-badge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5fd38d" />
          <stop offset="1" stopColor="#168a4e" />
        </linearGradient>
      </defs>
      <rect x="7" y="7" width="28" height="36" rx="4" fill="url(#au-board)" />
      <rect x="10" y="11" width="22" height="29" rx="2" fill="#fffdf6" />
      <rect x="15" y="4.5" width="12" height="7" rx="2.5" fill="url(#au-clip)" stroke="#7c8796" strokeWidth="1" />
      <circle cx="21" cy="7.6" r="1.4" fill="#7c8796" />
      {[17, 23, 29].map((y, i) => (
        <g key={y}>
          <rect x="13" y={y - 2} width="4" height="4" rx="1" fill={i < 2 ? "#1c7c4a" : "#e5383b"} />
          <rect x="19" y={y - 1} width={i === 1 ? 8 : 10} height="2" rx="1" fill="#c9c1ad" />
        </g>
      ))}
      <path d="M13.8 16.9l1.1 1.1 2-2.2M13.8 22.9l1.1 1.1 2-2.2" stroke="#fff" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="34.5" cy="34.5" r="9" fill="url(#au-badge)" stroke="#fff" strokeWidth="2" />
      <path d="M30.4 34.6l2.9 2.9 5.4-5.8" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Standards library: a row of bound volumes, one leaning. */
export function LibraryIcon({ size = 34 }: IconProps) {
  const books = [
    { x: 7, w: 8, h: 30, from: "#ff8a7a", to: "#d93a2b" },
    { x: 16, w: 9, h: 34, from: "#7fb6f2", to: "#2f6fca" },
    { x: 26, w: 7, h: 27, from: "#ffd06a", to: "#e59a12" },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        {books.map((b, i) => (
          <linearGradient key={i} id={`lb-${i}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={b.from} />
            <stop offset="1" stopColor={b.to} />
          </linearGradient>
        ))}
        <linearGradient id="lb-lean" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6fd39a" />
          <stop offset="1" stopColor="#1c7c4a" />
        </linearGradient>
      </defs>
      <rect x="4" y="41" width="40" height="3.2" rx="1.6" fill="#8a6a4a" />
      {books.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={41 - b.h} width={b.w} height={b.h} rx="1.6" fill={`url(#lb-${i})`} />
          <rect x={b.x + 1.5} y={41 - b.h + 4} width={b.w - 3} height="2" rx="1" fill="#fff" opacity="0.75" />
          <rect x={b.x + 1.5} y={41 - b.h + 8} width={b.w - 3} height="1.2" rx="0.6" fill="#fff" opacity="0.45" />
          <rect x={b.x + 1.5} y={37} width={b.w - 3} height="1.4" rx="0.7" fill="#000" opacity="0.15" />
        </g>
      ))}
      <g transform="rotate(16 38 41)">
        <rect x="34" y="14" width="8" height="27" rx="1.6" fill="url(#lb-lean)" />
        <rect x="35.5" y="18" width="5" height="2" rx="1" fill="#fff" opacity="0.75" />
        <text x="38" y="31" textAnchor="middle" fontFamily="Archivo, sans-serif" fontWeight="900" fontSize="4.6" fill="#fff" opacity="0.9" transform="rotate(-90 38 29)">IS</text>
      </g>
    </svg>
  );
}

/** Back to top: a glossy upward arrow with speed lines. */
export function TopIcon({ size = 34 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="tp-arrow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6ff7a" />
          <stop offset="1" stopColor="#9cc61a" />
        </linearGradient>
      </defs>
      <path d="M24 6L39 22H30V38a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V22H9z" fill="url(#tp-arrow)" stroke="#5f7d0a" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M24 10.5L33 20" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <path d="M21.5 26v9" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      <path d="M12 33v6M36 33v6M16 38v4M32 38v4" stroke="#cfe83a" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
