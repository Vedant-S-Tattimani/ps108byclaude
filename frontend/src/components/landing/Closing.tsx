import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Chevrons, HatchedSeal } from "../art/Doodles";
import { FieldScene } from "../art/Scenes";

const FAQS = [
  { q: "Is this keyword search?", a: "No. A concept graph, latent semantic analysis and spelling-tolerant matching are blended, so 'geyser', 'saria' or a Hindi sentence still reach the right standard." },
  { q: "How current are the versions?", a: "The prototype ships a curated sample of standards with versions and amendments. In production the knowledge base would sync from the BIS catalogue so the latest amendment is always shown." },
  { q: "Which certification schemes does it flag?", a: "ISI mark under Quality Control Orders (Scheme-I), Compulsory Registration Scheme for electronics and solar (Scheme-II), and Hallmarking with HUID for gold and silver." },
  { q: "Can GeM or a state portal use it?", a: "Yes. Every screen runs on a REST API, so a portal can call it from its item-specification form and pre-fill the standards and the clause." },
  { q: "What about languages other than Hindi?", a: "Nine Indian scripts are detected. An offline glossary covers common procurement words; with the NVIDIA Nemotron layer switched on, any language is translated." },
];

const MARQUEE = "IS 694 · IS 1786 · IS 14543 · IS 13252 · IS 4151 · IS 1417 · IS 269 · IS 2082 · ";

type Props = { onStart: () => void; onAudit: () => void };

export function Closing({ onStart, onAudit }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <section className="screen" id="faq" aria-labelledby="faq-h">
        <div className="doodles" aria-hidden>
          <div className="doodle hide-sm" style={{ top: "14%", left: "8%" }}><div className="bob"><HatchedSeal colour="#f08a8a" /></div></div>
          <div className="doodle hide-sm" style={{ top: "10%", right: "8%" }}><div className="bob-2"><Chevrons /></div></div>
        </div>
        <div className="wrap">
          <div className="section-head">
            <span className="sticker" data-reveal="sticker"><span className="ico"><HelpCircle size={11} /></span> FAQ</span>
            <h2 id="faq-h" className="display-md" data-reveal="fade">Answers before<br />you ask</h2>
          </div>
          <div className="faq">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div className="faq-item" key={f.q} data-open={isOpen} data-reveal="fade" style={{ ["--d" as string]: `${i * 70}ms` }}>
                  <button type="button" aria-expanded={isOpen} aria-controls={`faq-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                    {f.q}
                    <span className="plus" aria-hidden>+</span>
                  </button>
                  <div className="bar-body" id={`faq-${i}`} role="region" style={isOpen ? { gridTemplateRows: "1fr" } : undefined}>
                    <div><p style={{ margin: 0, padding: "0 22px 20px", color: "var(--ink-2)" }}>{f.a}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="cta-band" aria-labelledby="cta-h">
        <div className="marquee" style={{ top: 20 }} aria-hidden><span>{MARQUEE.repeat(4)}</span></div>
        <div className="marquee rev" style={{ bottom: 30 }} aria-hidden><span>{"Spec · Standard · Certify · Clause · ".repeat(6)}</span></div>
        <div className="wrap">
          <div className="cta-card" data-reveal="fade">
            <div className="cta-scene"><FieldScene /></div>
            <div className="cta-aside">
              <span>Tender going out this week?</span>
              <button type="button" className="btn btn-paper" onClick={onAudit}>Audit my spec</button>
            </div>
            <span className="sticker" style={{ left: "5%", top: "9%" }}><span className="ico" style={{ background: "var(--saffron)" }}>IS</span> Latest version</span>
            <span className="sticker lime" style={{ right: "8%", bottom: "26%", transform: "rotate(5deg)" }}><span className="ico" style={{ background: "var(--stamp-green)" }}>✓</span> Certification checked</span>
            <h2 id="cta-h">Write specs<br />nobody disputes</h2>
            <div style={{ position: "relative", marginTop: 20 }}>
              <button type="button" className="btn btn-ink" onClick={onStart}>Find a standard now</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
