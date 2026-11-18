import { Check, Minus } from "lucide-react";
import { useT } from "../i18n";
import type { SpecChecklist } from "../types";
import { Pin } from "./art/Doodles";

/** GeM-style key parameters for the product category: which ones the description already states. */
export function SpecChecklistCard({ checklist }: { checklist: SpecChecklist }) {
  const t = useT();
  const tone = checklist.completeness >= 80 ? "ok" : checklist.completeness >= 50 ? "warn" : "bad";
  return (
    <section className="paper pad-lg" data-reveal aria-labelledby="checklist-h" data-testid="spec-checklist">
      <Pin className="pin right" colour="#1c7c4a" />
      <div className="section-title" style={{ marginTop: 0 }}>
        <h2 id="checklist-h">{t("Spec completeness")}</h2>
        <span className={`tag ${tone}`} style={{ fontSize: 14 }}>
          {checklist.stated}/{checklist.total} key parameters · {checklist.completeness}%
        </span>
      </div>
      <p className="muted" style={{ margin: "0 0 12px", fontSize: 13.5 }}>
        Parameters a {checklist.category.toLowerCase()} tender should state, like GeM's golden parameters. Missing ones appear as blanks in the draft clause.
      </p>
      <ul className="checklist">
        {checklist.items.map((item) => (
          <li key={item.name} className={item.present ? "on" : "off"}>
            <span className="box" aria-hidden>{item.present ? <Check size={14} strokeWidth={3} /> : <Minus size={14} />}</span>
            <span>{item.name}</span>
            <b className="mono">{item.present ? item.value : "not stated"}</b>
          </li>
        ))}
      </ul>
    </section>
  );
}
