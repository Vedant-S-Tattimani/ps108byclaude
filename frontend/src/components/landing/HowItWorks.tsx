import { useState } from "react";
import { FileText, Languages, Link2, ShieldCheck, Target } from "lucide-react";
import { Scribble } from "../art/Doodles";

const STEPS = [
  { title: "Read the requirement", colour: "var(--bar-pink)", icon: Languages, iconBg: "#e5383b", body: "Detects the script, translates Indian-language text, and pulls out ratings, materials, grades and sizes such as 1.1 kV, XLPE or Fe 500D." },
  { title: "Match by meaning", colour: "var(--bar-blue)", icon: Target, iconBg: "#2f6fca", body: "A concept graph maps everyday words to standards (geyser to water heater, saria to reinforcement steel) and blends it with semantic and spelling-tolerant scores." },
  { title: "Link the allied standards", colour: "var(--bar-yellow)", icon: Link2, iconBg: "#c79a00", body: "Follows each standard's references to its test methods, terminology, safety, installation codes, sampling plans and related products." },
  { title: "Flag certification", colour: "var(--bar-mint)", icon: ShieldCheck, iconBg: "#1c7c4a", body: "Says whether the ISI mark, CRS registration or Hallmarking is mandatory and names the Quality Control Order behind it." },
  { title: "Draft the clause", colour: "var(--bar-peach)", icon: FileText, iconBg: "#ff7a1a", body: "Writes the technical-specification clause with the latest version, amendments, certification, tests and sampling, ready to paste into the tender." },
];

export function HowItWorks() {
  const [open, setOpen] = useState(0);
  return (
    <section className="screen" id="how" aria-labelledby="how-h">
      <div className="wrap">
        <div className="section-head">
          <span className="sticker lime" data-reveal="sticker"><span className="ico" style={{ background: "var(--stamp-green)" }}>✓</span> How it works</span>
          <h2 id="how-h" className="display-md" data-reveal="fade">From one line of text<br />to a tender clause</h2>
          <Scribble colour="var(--sky)" />
        </div>
        <div className="bars">
          {STEPS.map((step, i) => {
            const isOpen = open === i;
            const Icon = step.icon;
            return (
              <div key={step.title} className="bar-item" style={{ background: step.colour, ["--d" as string]: `${i * 90}ms` }} data-open={isOpen} data-reveal="fade">
                <button type="button" className="bar-trigger" aria-expanded={isOpen} aria-controls={`step-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                  <span className="num">0{i + 1}</span>
                  <h3>{step.title}</h3>
                  <span className="bar-icon" style={{ background: step.iconBg }}><Icon size={18} aria-hidden /></span>
                </button>
                <div className="bar-body" id={`step-${i}`} role="region">
                  <div><p>{step.body}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
