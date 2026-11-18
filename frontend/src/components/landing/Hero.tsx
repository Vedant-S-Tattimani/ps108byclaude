import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { ArrowCursor, Bulb, Burst, Chevrons, Cloud, GooglyEyes, HatchedSeal, Highlight, LoopMark, Pencil, Pin, Plane, Scribble } from "../art/Doodles";

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !to) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1400);
        setValue(Math.round(to * (1 - Math.pow(1 - t, 3))));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);
  return <b ref={ref}>{value}{suffix}</b>;
}

const Word = ({ text, delay }: { text: string; delay: number }) => (
  <span className="rise-word" style={{ animationDelay: `${delay}ms` }}>{text}&nbsp;</span>
);

type DoodleSpec = { node: JSX.Element; style: React.CSSProperties; loop: string; depth: number; hide?: string };

const DOODLES: DoodleSpec[] = [
  { node: <HatchedSeal />, style: { top: "13%", left: "13%" }, loop: "bob", depth: 14, hide: "hide-sm" },
  { node: <Chevrons />, style: { top: "8%", right: "9%" }, loop: "bob-2", depth: 18, hide: "hide-sm" },
  { node: <Scribble />, style: { top: "18%", left: "42%" }, loop: "sway", depth: 6, hide: "hide-sm" },
  { node: <LoopMark />, style: { top: "44%", left: "4%" }, loop: "", depth: 22, hide: "hide-sm" },
  { node: <ArrowCursor />, style: { top: "60%", left: "22%" }, loop: "wiggle", depth: 26 },
  { node: <Cloud />, style: { top: "38%", left: "30%" }, loop: "bob", depth: 12, hide: "hide-md" },
  { node: <GooglyEyes />, style: { top: "40%", right: "10%" }, loop: "", depth: 10 },
  { node: <Bulb />, style: { top: "52%", right: "6%" }, loop: "wiggle", depth: 20, hide: "hide-sm" },
  { node: <Pencil />, style: { top: "57%", right: "13%" }, loop: "bob-2", depth: 24, hide: "hide-sm" },
  { node: <Scribble colour="#f5c542" width={110} />, style: { bottom: "16%", left: "3%" }, loop: "sway", depth: 8 },
  { node: <Scribble colour="#e7c94f" width={100} />, style: { top: "50%", right: "20%" }, loop: "sway", depth: 8, hide: "hide-md" },
  { node: <Plane />, style: { bottom: "22%", right: "4%" }, loop: "bob", depth: 30, hide: "hide-sm" },
  { node: <Burst />, style: { bottom: "10%", left: "48%" }, loop: "spin-slow", depth: 16, hide: "hide-sm" },
];

type Props = { standards: number; onStart: () => void };

export function Hero({ standards, onStart }: Props) {
  return (
    <section className="hero" aria-labelledby="hero-h">
      <div className="doodles" aria-hidden>
        {DOODLES.map((d, i) => (
          <div key={i} className={`doodle ${d.hide ?? ""}`} style={{ ...d.style, ["--depth" as string]: `${d.depth}px` }}>
            <div className={d.loop} style={{ animationDelay: `${(i % 5) * 0.4}s` }}>{d.node}</div>
          </div>
        ))}
      </div>

      <div className="wrap hero-inner">
        <span className="sticker" data-reveal="sticker">
          <span className="ico"><Search size={11} /></span> BIS standards finder
        </span>
        <h1 id="hero-h" className="display">
          <Word text="The" delay={100} />
          <Word text="right" delay={180} />
          <span className="hl">
            <Highlight />
            <Word text="Indian" delay={260} />
            <Word text="Standard" delay={340} />
          </span>
          <br />
          <Word text="for" delay={420} />
          <Word text="every" delay={500} />
          <Word text="tender" delay={580} />
        </h1>
        <p className="lede rise-word" style={{ animationDelay: "700ms" }}>
          Describe the item in English or your own language. Get the applicable IS, its latest amendment, the allied test and installation standards, the BIS certification bidders must hold, and a clause ready to paste.
        </p>
        <button type="button" className="btn btn-sticker rise-word" style={{ animationDelay: "850ms" }} onClick={onStart}>
          <Pin /> Find a standard
        </button>
      </div>

      <div className="wrap hero-stats">
        <article className="paper stat-card tilt-l" data-reveal style={{ ["--r-from" as string]: "-9deg", ["--r-to" as string]: "-1.6deg", ["--d" as string]: "900ms" }}>
          <Pin />
          <span className="fold" />
          <CountUp to={standards} />
          <h3>Standards mapped</h3>
          <p>Each with its version, amendments and certification rule.</p>
        </article>
        <article className="paper stat-card tilt-r" data-reveal style={{ ["--r-from" as string]: "8deg", ["--r-to" as string]: "1.4deg", ["--d" as string]: "1050ms" }}>
          <Pin colour="#2f6fca" />
          <span className="fold saffron" />
          <CountUp to={7} />
          <h3>Kinds of allied link</h3>
          <p>Normative, test, terminology, safety, installation, product, sampling.</p>
        </article>
        <article className="paper stat-card tilt-l" data-reveal style={{ ["--r-from" as string]: "-7deg", ["--r-to" as string]: "-1.6deg", ["--d" as string]: "1200ms" }}>
          <Pin colour="#1c7c4a" />
          <span className="fold" />
          <CountUp to={9} />
          <h3>Indian scripts read</h3>
          <p>Hindi, Tamil, Bengali, Telugu and more, typed or spoken.</p>
        </article>
      </div>
    </section>
  );
}
