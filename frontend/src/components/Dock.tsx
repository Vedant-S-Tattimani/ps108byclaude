import { useRef } from "react";
import { ArrowUp, BookOpen, FileSearch, Sparkles } from "lucide-react";
import { useT } from "../i18n";

export type View = "recommend" | "audit" | "library" | "api";

const ITEMS: { id: View; label: string; icon: typeof Sparkles; bg: string }[] = [
  { id: "recommend", label: "Find standards", icon: Sparkles, bg: "linear-gradient(160deg,#ffb35c,#ff7a1a)" },
  { id: "audit", label: "Spec audit", icon: FileSearch, bg: "linear-gradient(160deg,#ff8b8b,#e5383b)" },
  { id: "library", label: "Standards library", icon: BookOpen, bg: "linear-gradient(160deg,#7fb6f2,#2f6fca)" },
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
            <Icon size={24} strokeWidth={2.2} aria-hidden />
          </span>
          {id === "recommend" && resultCount > 0 && <span className="dock-badge" key={resultCount}>{resultCount}</span>}
          <span className="dock-label">{t(label)}</span>
        </button>
      ))}
      <span className="dock-sep" aria-hidden />
      <button type="button" className="dock-item" aria-label={t("Back to top")} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        <span className="dock-tile" style={{ background: "linear-gradient(160deg,#4a4a4a,#171717)" }}>
          <ArrowUp size={22} aria-hidden />
        </span>
        <span className="dock-label">{t("Back to top")}</span>
      </button>
    </nav>
  );
}
