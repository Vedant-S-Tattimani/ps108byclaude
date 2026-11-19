import { useRef } from "react";
import type { ComponentType } from "react";
import { AuditIcon, FindIcon, LibraryIcon, TopIcon } from "./art/DockIcons";
import { useT } from "../i18n";

export type View = "recommend" | "audit" | "library" | "api";

/* Each tile is a soft tinted glass square; the illustration carries the colour. */
const ITEMS: { id: View; label: string; icon: ComponentType<{ size?: number }>; bg: string }[] = [
  { id: "recommend", label: "Find standards", icon: FindIcon, bg: "linear-gradient(160deg,#fff7ec 0%,#ffe2c2 100%)" },
  { id: "audit", label: "Spec audit", icon: AuditIcon, bg: "linear-gradient(160deg,#fff4f2 0%,#ffd9d3 100%)" },
  { id: "library", label: "Standards library", icon: LibraryIcon, bg: "linear-gradient(160deg,#f2f8ff 0%,#d5e7fb 100%)" },
];

type Props = {
  view: View;
  resultCount: number;
  onNavigate: (view: View) => void;
};

/** Floating dock with pointer magnification: the hovered tile grows, neighbours grow less. */
export function Dock({ view, resultCount, onNavigate }: Props) {
  const ref = useRef<HTMLElement>(null);
  const t = useT();

  const magnify = (clientX: number | null) => {
    ref.current?.querySelectorAll<HTMLElement>(".dock-item").forEach((item) => {
      if (clientX === null) {
        item.style.transform = "";
        return;
      }
      const rect = item.getBoundingClientRect();
      const distance = Math.abs(clientX - (rect.left + rect.width / 2));
      const scale = 1 + Math.max(0, 0.45 - distance / 220);
      item.style.transform = `scale(${scale.toFixed(3)}) translateY(${(-(scale - 1) * 18).toFixed(1)}px)`;
    });
  };

  return (
    <nav
      ref={ref}
      className="dock"
      aria-label="Main"
      onPointerMove={(e) => e.pointerType === "mouse" && magnify(e.clientX)}
      onPointerLeave={() => magnify(null)}
    >
      {ITEMS.map(({ id, label, icon: Icon, bg }) => (
        <button key={id} type="button" className="dock-item" aria-label={t(label)} aria-current={view === id ? "page" : undefined} onClick={() => onNavigate(id)}>
          <span className="dock-tile" style={{ background: bg }}>
            <Icon size={36} />
          </span>
          {id === "recommend" && resultCount > 0 && <span className="dock-badge" key={resultCount}>{resultCount}</span>}
          <span className="dock-label">{t(label)}</span>
        </button>
      ))}
      <span className="dock-sep" aria-hidden />
      <button type="button" className="dock-item" aria-label={t("Back to top")} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        <span className="dock-tile" style={{ background: "linear-gradient(160deg,#3a3a3a,#141414)" }}>
          <TopIcon size={34} />
        </span>
        <span className="dock-label">{t("Back to top")}</span>
      </button>
    </nav>
  );
}
