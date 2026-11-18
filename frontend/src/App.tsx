import { useCallback, useEffect, useState } from "react";
import { FileSearch, PenLine } from "lucide-react";
import { api } from "./api";
import { ApiView } from "./components/ApiView";
import { AuditView } from "./components/AuditView";
import { Dock, type View } from "./components/Dock";
import { LibraryView } from "./components/LibraryView";
import { QueryPanel } from "./components/QueryPanel";
import { ResultsView } from "./components/ResultsView";
import { StandardDrawer } from "./components/StandardDrawer";
import { TenderItems } from "./components/TenderItems";
import { Bulb, Chevrons, GooglyEyes, HatchedSeal, Pin, Scribble } from "./components/art/Doodles";
import { CaseFiles } from "./components/landing/CaseFiles";
import { Closing } from "./components/landing/Closing";
import { Hero } from "./components/landing/Hero";
import { HowItWorks } from "./components/landing/HowItWorks";
import { ErrorBox } from "./components/ui";
import { useMotion } from "./hooks/useMotion";
import { CertificateChecker } from "./components/CertificateChecker";
import { CursorEyes } from "./components/CursorEyes";
import { UpdatesPanel } from "./components/UpdatesPanel";
import { useLang, useT } from "./i18n";
import type { Health, RecommendResult, UploadResult } from "./types";

const VIEWS: View[] = ["recommend", "audit", "library", "api"];

function readView(): View {
  const hash = window.location.hash.replace("#", "") as View;
  return VIEWS.includes(hash) ? hash : "recommend";
}

const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

/** Bring the search notesheet into view and put the cursor in the text box. */
function focusSearch(): void {
  document.getElementById("search")?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  window.setTimeout(() => document.getElementById("query")?.focus({ preventScroll: true }), 450);
}

/** Bring the results column into view: on narrow screens it sits below the notesheet. */
function scrollToResults(): void {
  window.requestAnimationFrame(() =>
    document.getElementById("results")?.scrollIntoView({ behavior: scrollBehavior(), block: "start" }),
  );
}

const PAGE_HEADS: Record<Exclude<View, "recommend">, { sticker: string; title: string; note: string }> = {
  audit: { sticker: "Spec audit", title: "Check a tender spec before it goes live", note: "outdated IS? missing ISI clause? we flag it" },
  library: { sticker: "Library", title: "Every standard in the knowledge base", note: "filter by category or certification" },
  api: { sticker: "Portal API", title: "Built to sit inside procurement portals", note: "one envelope, ten endpoints and a drop-in widget" },
};

function PageHead({ view }: { view: Exclude<View, "recommend"> }) {
  const head = PAGE_HEADS[view];
  return (
    <section className="page-head">
      <div className="doodles" aria-hidden>
        <div className="doodle hide-sm" style={{ top: "40%", right: "6%" }}><GooglyEyes /></div>
        <div className="doodle hide-sm" style={{ top: "26%", right: "22%" }}><div className="bob"><HatchedSeal /></div></div>
        <div className="doodle hide-sm" style={{ bottom: "8%", right: "14%" }}><div className="wiggle"><Bulb /></div></div>
        <div className="doodle hide-md" style={{ top: "22%", right: "36%" }}><div className="bob-2"><Chevrons /></div></div>
      </div>
      <div className="wrap" style={{ position: "relative", zIndex: 2 }}>
        <span className="sticker" data-reveal="sticker"><span className="ico"><FileSearch size={11} /></span> {head.sticker}</span>
        <h1 className="display" style={{ marginTop: 20 }}>{head.title}</h1>
        <p className="hand" style={{ fontSize: 26, color: "var(--info)", margin: "14px 0 0" }}>{head.note}</p>
      </div>
    </section>
  );
}

export default function App() {
  const [view, setView] = useState<View>(readView);
  const [health, setHealth] = useState<Health | null>(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [upload, setUpload] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  useMotion();
  const { lang, setLang } = useLang();
  const t = useT();

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth(null)); // hero falls back to the bundled count
    const onHash = () => setView(readView());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = useCallback((next: View) => {
    if (next === "recommend" && readView() === "recommend") {
      focusSearch(); // already here: take the officer straight to the search box
      return;
    }
    window.location.hash = next;
    setView(next);
    window.scrollTo({ top: 0 });
  }, []);

  const runQuery = useCallback(async (text: string) => {
    setQuery(text);
    setIsBusy(true);
    setError(null);
    scrollToResults();
    try {
      setResult(await api.recommend(text, 5));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Recommendation failed.");
    } finally {
      setIsBusy(false);
    }
  }, []);

  const runUpload = useCallback(async (file: File) => {
    setIsBusy(true);
    setError(null);
    scrollToResults();
    try {
      const data = await api.upload(file);
      setUpload(data);
      setResult(data.recommendation);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setIsBusy(false);
    }
  }, []);

  const runCase = useCallback(
    (text: string) => {
      setUpload(null);
      if (view !== "recommend") go("recommend");
      setTimeout(() => runQuery(text), view === "recommend" ? 0 : 60);
    },
    [go, runQuery, view],
  );

  const closeDrawer = useCallback(() => setOpenId(null), []);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <div className="wrap">
          <a className="brand" href="#recommend" onClick={(e) => { e.preventDefault(); go("recommend"); }}>
            <img src="/favicon.svg" width="30" height="30" alt="" />
            SpecSetu<sup>®</sup>
          </a>
          <div className="lang-toggle" role="group" aria-label="Interface language">
            <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
            <button type="button" aria-pressed={lang === "hi"} onClick={() => setLang("hi")} lang="hi">हिं</button>
          </div>
        </div>
      </header>

      <main id="main">
        {view === "recommend" && (
          <>
            <Hero standards={health?.standards ?? 82} onStart={focusSearch} />
            <section className="screen" id="search" aria-labelledby="search-h" style={{ paddingTop: 40 }}>
              <div className="wrap">
                <div className="section-head">
                  <span className="sticker" data-reveal="sticker"><span className="ico" style={{ background: "var(--saffron)" }}><PenLine size={11} /></span> {t("Find standards")}</span>
                  <h2 id="search-h" className="display-md" data-reveal="fade">{lang === "hi" ? t("Tell us what you are buying") : <>Tell us what<br />you are buying</>}</h2>
                  <Scribble colour="#f5c542" />
                </div>
                <div className="workspace">
                  <QueryPanel query={query} onQueryChange={setQuery} isBusy={isBusy} onSubmit={(text) => { setUpload(null); runQuery(text); }} onUpload={runUpload} />
                  <div className="stack" id="results" aria-live="polite" aria-busy={isBusy}>
                    {error && <ErrorBox message={error} />}
                    {upload && !isBusy && <TenderItems upload={upload} onRunItem={runQuery} onOpen={setOpenId} onAudit={() => go("audit")} />}
                    {isBusy && (
                      <>
                        <div className="skeleton" style={{ height: 100 }} />
                        <div className="skeleton" />
                        <div className="skeleton" />
                      </>
                    )}
                    {!isBusy && result && <ResultsView result={result} onOpen={setOpenId} />}
                    {!isBusy && !result && !error && (
                      <div className="paper empty-state tilt-r" data-reveal style={{ ["--r-to" as string]: "1.4deg" }}>
                        <Pin className="pin center" />
                        <div style={{ display: "flex", justifyContent: "center" }}><GooglyEyes /></div>
                        <h2>{t("Waiting for your indent")}</h2>
                        <p>Type a line, speak it, drop a tender PDF, or open a case file below. Standards, allied references and certification rules land here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
            <HowItWorks />
            <CaseFiles onRun={runCase} />
            <Closing onStart={focusSearch} onAudit={() => go("audit")} />
          </>
        )}
        {view !== "recommend" && <PageHead view={view} />}
        {view !== "recommend" && (
          <div className="wrap" style={{ paddingBottom: 140 }}>
            {view === "audit" && (
              <>
                <AuditView onOpen={setOpenId} />
                <CertificateChecker />
              </>
            )}
            {view === "library" && (
              <>
                <UpdatesPanel onOpen={setOpenId} />
                <LibraryView onOpen={setOpenId} />
              </>
            )}
            {view === "api" && <ApiView />}
          </div>
        )}
      </main>

      <footer className="footer" style={view === "recommend" ? undefined : { background: "var(--paper-2)", paddingTop: 40 }}>
        <div className="wrap">
          <div>
            <div className="big">SpecSetu®</div>
            <p className="muted" style={{ margin: "8px 0 0", maxWidth: "52ch" }}>
              Prototype for DoCA problem statement 26108. Knowledge base is a curated sample; confirm versions on the BIS Standards portal before issuing a tender.
            </p>
          </div>
          <nav aria-label="Footer">
            <a href="#recommend" onClick={(e) => { e.preventDefault(); go("recommend"); }}>Find standards</a>
            <a href="#audit" onClick={(e) => { e.preventDefault(); go("audit"); }}>Spec audit</a>
            <a href="#library" onClick={(e) => { e.preventDefault(); go("library"); }}>Library</a>
            <a href="#api" onClick={(e) => { e.preventDefault(); go("api"); }}>Portal API</a>
          </nav>
        </div>
      </footer>

      <CursorEyes />
      <Dock view={view} resultCount={result?.recommendations.length ?? 0} onNavigate={go} />
      {openId && <StandardDrawer id={openId} onClose={closeDrawer} onOpen={setOpenId} />}
    </>
  );
}
