/* Flat illustrated scenes for case-file cards and the closing banner. Original artwork. */

type SceneProps = { kind: "cable" | "street" | "steel" | "water" | "laptop" | "gold" };

const BG: Record<SceneProps["kind"], [string, string]> = {
  cable: ["#ffd9b8", "#ffb27a"],
  street: ["#1d2c4f", "#3c5a8f"],
  steel: ["#dfe6ee", "#b8c6d6"],
  water: ["#cdeafd", "#8fcaf2"],
  laptop: ["#dcf4e1", "#a9dfb6"],
  gold: ["#fff1b8", "#f5cf5a"],
};

export function CaseScene({ kind }: SceneProps) {
  const [a, b] = BG[kind];
  return (
    <svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`g-${kind}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill={`url(#g-${kind})`} />
      {kind === "cable" && (
        <g stroke="#2b2b2b" strokeWidth="3">
          <circle cx="160" cy="120" r="70" fill="#8a5a3a" />
          <circle cx="160" cy="120" r="54" fill="none" stroke="#f26d5b" strokeWidth="14" />
          <circle cx="160" cy="120" r="38" fill="none" stroke="#2b2b2b" strokeWidth="12" />
          <circle cx="160" cy="120" r="16" fill="#d9b48f" />
          <path d="M214 140c40 10 50 50 90 60" fill="none" stroke="#2b2b2b" strokeWidth="12" strokeLinecap="round" />
          <path d="M214 140c40 10 50 50 90 60" fill="none" stroke="#f26d5b" strokeWidth="6" strokeLinecap="round" />
        </g>
      )}
      {kind === "street" && (
        <g>
          {[40, 140, 240].map((x) => (
            <g key={x}>
              <path d={`M${x + 16} 60 L${x - 30} 240 L${x + 62} 240 Z`} fill="#ffe98a" opacity="0.25" />
              <rect x={x + 12} y="70" width="8" height="170" fill="#c9d3e3" stroke="#2b2b2b" strokeWidth="2" />
              <path d={`M${x + 16} 72 q0 -22 26 -22`} fill="none" stroke="#c9d3e3" strokeWidth="6" />
              <rect x={x + 30} y="46" width="30" height="10" rx="4" fill="#fff6c2" stroke="#2b2b2b" strokeWidth="2" />
            </g>
          ))}
          <circle cx="280" cy="34" r="12" fill="#fff6c2" />
        </g>
      )}
      {kind === "steel" && (
        <g stroke="#2b2b2b" strokeWidth="2.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i} transform={`translate(30 ${60 + i * 24}) rotate(-8)`}>
              <rect width="270" height="14" rx="7" fill="#6e7b8b" />
              {Array.from({ length: 13 }, (_, k) => (
                <path key={k} d={`M${12 + k * 20} 1 l6 12`} stroke="#4a5563" strokeWidth="2" />
              ))}
            </g>
          ))}
        </g>
      )}
      {kind === "water" && (
        <g stroke="#2b2b2b" strokeWidth="3">
          <rect x="110" y="40" width="100" height="170" rx="26" fill="#e9f6ff" fillOpacity="0.85" />
          <rect x="140" y="22" width="40" height="22" rx="6" fill="#4d7fd1" />
          <path d="M112 120 q48 -16 96 0 v64 a24 24 0 0 1 -24 24 h-48 a24 24 0 0 1 -24 -24z" fill="#8fcaf2" strokeWidth="0" />
          <path d="M120 80h80M120 160h80" stroke="#bfe0f7" strokeWidth="4" />
          <circle cx="250" cy="70" r="7" fill="#fff" />
          <circle cx="66" cy="150" r="5" fill="#fff" />
        </g>
      )}
      {kind === "laptop" && (
        <g stroke="#2b2b2b" strokeWidth="3" strokeLinejoin="round">
          <rect x="70" y="50" width="180" height="120" rx="10" fill="#1d2c4f" />
          <rect x="82" y="62" width="156" height="96" rx="4" fill="#dcefff" />
          <path d="M40 176 h240 l-18 24 h-204 z" fill="#c9d3e3" />
          <rect x="96" y="78" width="70" height="8" rx="4" fill="#ff8a1f" strokeWidth="0" />
          <rect x="96" y="96" width="120" height="6" rx="3" fill="#8fb4dd" strokeWidth="0" />
          <rect x="96" y="110" width="100" height="6" rx="3" fill="#8fb4dd" strokeWidth="0" />
          <rect x="96" y="124" width="60" height="18" rx="5" fill="#1c7c4a" strokeWidth="0" />
        </g>
      )}
      {kind === "gold" && (
        <g stroke="#2b2b2b" strokeWidth="3">
          <path d="M130 20 l30 70 30 -70" fill="none" stroke="#c2262b" strokeWidth="14" />
          <path d="M130 20 l30 70 30 -70" fill="none" stroke="#2b2b2b" strokeWidth="2" />
          <circle cx="160" cy="140" r="62" fill="#f5b91f" />
          <circle cx="160" cy="140" r="46" fill="#ffd75e" />
          <polygon points="160,108 169,130 193,131 174,146 181,170 160,156 139,170 146,146 127,131 151,130" fill="#f5b91f" />
        </g>
      )}
    </svg>
  );
}

/** Closing banner landscape: dawn sky over fields with a warehouse and a road. */
export function FieldScene() {
  return (
    <svg viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b8fd6" />
          <stop offset="0.65" stopColor="#a9c9ee" />
          <stop offset="1" stopColor="#f4d9a8" />
        </linearGradient>
        <linearGradient id="field1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c7d94a" />
          <stop offset="1" stopColor="#8fae2f" />
        </linearGradient>
        <linearGradient id="field2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7aa33a" />
          <stop offset="1" stopColor="#4f7a26" />
        </linearGradient>
      </defs>
      <rect width="1200" height="520" fill="url(#sky)" />
      <g fill="#fff" opacity="0.85">
        <ellipse cx="220" cy="110" rx="90" ry="26" />
        <ellipse cx="290" cy="96" rx="60" ry="30" />
        <ellipse cx="900" cy="80" rx="110" ry="28" />
        <ellipse cx="980" cy="66" rx="70" ry="32" />
      </g>
      <circle cx="760" cy="250" r="54" fill="#ffd27a" opacity="0.9" />
      <path d="M0 330 C200 270 380 300 560 320 S900 250 1200 300 V520 H0Z" fill="#9dbb4a" />
      <g transform="translate(820 250)">
        <rect width="190" height="80" fill="#e9e3d6" stroke="#5b5b5b" strokeWidth="3" />
        <path d="M-10 0 L95 -42 L200 0Z" fill="#c2262b" />
        <rect x="70" y="34" width="50" height="46" fill="#8a8a8a" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={16 + i * 140 * 0.5} y="16" width="20" height="12" fill="#5b8fd6" opacity={i === 1 ? 0 : 1} />
        ))}
      </g>
      <path d="M0 380 C260 330 520 360 760 390 S1050 340 1200 370 V520 H0Z" fill="url(#field1)" />
      <g fill="#f5e663" opacity="0.8">
        {Array.from({ length: 70 }, (_, i) => (
          <circle key={i} cx={(i * 173) % 1200} cy={400 + ((i * 37) % 110)} r={2 + (i % 3)} />
        ))}
      </g>
      <path d="M520 520 C560 450 600 410 640 386 L660 386 C640 420 640 470 700 520Z" fill="#d9c79a" />
      <path d="M0 450 C300 420 500 460 700 480 S1000 440 1200 460 V520 H0Z" fill="url(#field2)" />
    </svg>
  );
}
