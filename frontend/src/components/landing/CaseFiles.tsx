import { FolderOpen } from "lucide-react";
import { Clip } from "../art/Doodles";
import { CaseScene } from "../art/Scenes";

const CASES = [
  { kind: "cable", title: "Substation cabling", query: "1.1 kV XLPE armoured aluminium power cable for substation", result: "IS 7098 (Part 1)", stamp: "ISI" },
  { kind: "street", title: "Municipal lighting", query: "LED street lights 90W for municipal roads", result: "IS 10322 (Part 5/Sec 3)", stamp: "CRS" },
  { kind: "steel", title: "School building", query: "TMT saria Fe 500D for school building", result: "IS 1786", stamp: "ISI" },
  { kind: "water", title: "Hostel supply", query: "बोतलबंद पीने का पानी 20 लीटर जार", result: "IS 14543", stamp: "ISI" },
  { kind: "laptop", title: "District office IT", query: "Laptops and printers for district office", result: "IS 13252 (Part 1)", stamp: "CRS" },
  { kind: "gold", title: "State awards", query: "22 carat gold medals for state awards", result: "IS 1417", stamp: "HUID" },
] as const;

const DOT_COLOURS = ["#f08a8a", "#7fb6f2", "#f5c542"];

type Props = { onRun: (query: string) => void };

export function CaseFiles({ onRun }: Props) {
  return (
    <section className="screen" id="cases" aria-labelledby="cases-h" style={{ background: "linear-gradient(180deg, #a9c9ee 0%, #cfe2f4 55%, var(--paper) 100%)" }}>
      <div className="wrap">
        <div className="section-head">
          <span className="sticker" data-reveal="sticker"><span className="ico"><FolderOpen size={11} /></span> Case files</span>
          <h2 id="cases-h" className="display-md" data-reveal="fade">Real indents,<br />answered in seconds</h2>
          <p className="lede">Open a file to run it live against the engine.</p>
        </div>
        <div className="cases">
          {CASES.map((c, i) => (
            <button type="button" key={c.kind} className="case" data-reveal style={{ ["--d" as string]: `${(i % 3) * 120}ms`, ["--r-from" as string]: i % 2 ? "7deg" : "-8deg" }} onClick={() => onRun(c.query)} aria-label={`Run case: ${c.query}`}>
              <Clip />
              <div className="case-window">
                <div className="case-dots">{DOT_COLOURS.map((col) => <i key={col} style={{ background: col }} />)}</div>
                <div className="case-art"><CaseScene kind={c.kind} /></div>
                <div className="case-query">“{c.query}”</div>
              </div>
              <span className={`stamp ${c.stamp === "CRS" ? "navy" : c.stamp === "HUID" ? "" : "green"}`}>{c.stamp}</span>
              <div className="case-foot">
                <b>{c.title}</b>
                <span className="mono">{c.result}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
