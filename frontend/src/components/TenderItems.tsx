import { FileText } from "lucide-react";
import type { UploadResult } from "../types";
import { Pin } from "./art/Doodles";
import { CertBadge } from "./ui";

type Props = {
  upload: UploadResult;
  onRunItem: (text: string) => void;
  onOpen: (id: string) => void;
  onAudit: () => void;
};

/** Item-by-item view of an uploaded tender: one standard and certification per line item. */
export function TenderItems({ upload, onRunItem, onOpen, onAudit }: Props) {
  return (
    <section className="paper pad-lg tilt-r" data-reveal="fade" aria-labelledby="items-h" data-testid="tender-items">
      <Pin className="pin right" />
      <span className="eyebrow"><FileText size={12} style={{ verticalAlign: -2 }} /> Document analysed</span>
      <div className="section-title" style={{ marginTop: 0 }}>
        <h2 id="items-h">{upload.items.length ? `${upload.items.length} line items found` : "Whole document read as one item"}</h2>
        <button type="button" className="chip" onClick={onAudit}>Spec score {upload.audit.score}/100 · open audit</button>
      </div>
      <p className="muted" style={{ margin: "0 0 14px", fontSize: 13.5 }}>
        <b>{upload.filename}</b> · {upload.characters.toLocaleString()} characters · {upload.audit.counts.high} critical issues in the text
      </p>
      {upload.items.length > 0 && (
        <ol className="items-list">
          {upload.items.map((row, i) => (
            <li key={`${row.item}-${i}`} className={row.matched ? "" : "unmatched"}>
              <span className="mono item-no">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <button type="button" className="item-text" onClick={() => onRunItem(row.item)} title="See full analysis for this item">
                  {row.item}
                </button>
                <div className="rec-meta" style={{ marginTop: 6 }}>
                  {row.matched ? (
                    <button type="button" className="tag ok" style={{ border: 0, cursor: "pointer" }} onClick={() => onOpen(row.standard.id)}>
                      <span className="mono">{row.standard.designation}</span> · {row.standard.confidence}%
                    </button>
                  ) : (
                    <span className="tag warn">No confident match - check manually</span>
                  )}
                  {row.matched && <CertBadge cert={row.standard.certification} />}
                  {row.alternatives.length > 0 && <span className="tag">also: {row.alternatives.join(", ")}</span>}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
