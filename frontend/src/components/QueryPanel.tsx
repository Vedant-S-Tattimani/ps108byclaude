import { useRef, useState } from "react";
import { FileUp, Loader2, Mic, MicOff, Sparkles } from "lucide-react";
import { useSpeech } from "../hooks/useSpeech";
import { Pin } from "./art/Doodles";
import { useT } from "../i18n";

const EXAMPLES = [
  "1.1 kV XLPE armoured aluminium power cable for substation",
  "LED street lights 90W for municipal roads",
  "TMT saria Fe 500D for school building",
  "बोतलबंद पीने का पानी 20 लीटर जार",
  "Laptops and printers for district office",
  "22 carat gold medals for state awards",
  "குடிநீர் குழாய்",
];

const VOICE_LANGS = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "ta-IN", label: "தமிழ்" },
  { code: "bn-IN", label: "বাংলা" },
  { code: "te-IN", label: "తెలుగు" },
];

type Props = {
  query: string;
  onQueryChange: (query: string) => void;
  isBusy: boolean;
  onSubmit: (query: string) => void;
  onUpload: (file: File) => void;
};

export function QueryPanel({ query, onQueryChange: setQuery, isBusy, onSubmit, onUpload }: Props) {
  const t = useT();
  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [isOver, setIsOver] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [nudge, setNudge] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const speech = useSpeech((text) => setQuery(query ? `${query} ${text}` : text));

  const submit = () => {
    if (isBusy) return;
    if (query.trim().length < 2) {
      // Never fail silently: explain, point at the box, and give it a nudge.
      setHint("Type what you are buying first, or pick an example below.");
      setNudge((n) => n + 1);
      textarea.current?.focus();
      return;
    }
    setHint(null);
    onSubmit(query.trim());
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div className="paper pad-lg sticky" data-reveal style={{ ["--r-from" as string]: "-6deg" }}>
      <Pin />
      <span className="fold saffron" />
      <span className="eyebrow">{t("Notesheet · describe the item")}</span>
      <label className="field-label" htmlFor="query">
        {t("Product description, technical spec or tender text")}
      </label>
      <textarea
        id="query"
        ref={textarea}
        key={`query-${nudge}`}
        className={`query ${hint ? "nudge" : ""}`}
        aria-invalid={hint ? true : undefined}
        aria-describedby={hint ? "query-hint" : undefined}
        autoFocus={nudge > 0}
        value={query}
        placeholder="e.g. Copper PVC insulated house wiring cable 2.5 sq mm for government quarters"
        onChange={(e) => {
          setQuery(e.target.value);
          if (hint) setHint(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit();
        }}
      />
      {hint && (
        <p id="query-hint" className="field-hint" role="alert">
          {hint}
        </p>
      )}
      <div className="input-tools">
        <button type="button" className="btn btn-ink" style={{ flex: 1 }} onClick={submit} disabled={isBusy} aria-busy={isBusy}>
          {isBusy ? <Loader2 size={16} className="spin" aria-hidden /> : <Sparkles size={16} aria-hidden />} {isBusy ? "Analysing…" : t("Find standards")}{" "}
          <span className="visually-hidden">Ctrl ↵</span>
        </button>
        <select className="input" aria-label="Voice input language" value={voiceLang} onChange={(e) => setVoiceLang(e.target.value)}>
          {VOICE_LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={`btn btn-paper ${speech.listening ? "recording" : ""}`}
          aria-label={speech.listening ? "Stop voice input" : "Speak your requirement"}
          aria-pressed={speech.listening}
          onClick={() => (speech.listening ? speech.stop() : speech.start(voiceLang))}
          disabled={!speech.supported}
          title={speech.supported ? "Voice input" : "Voice input needs Chrome or Edge"}
        >
          {speech.listening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      </div>
      {speech.error && <p className="muted" style={{ fontSize: 12.5 }}>{speech.error}</p>}

      <div
        className={`dropzone ${isOver ? "over" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Upload a tender document (PDF, DOCX or TXT)"
        onClick={() => fileInput.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInput.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <FileUp size={22} aria-hidden />
        <div>
          <b>{t("Upload a tender document")}</b>
          <span>{t("PDF, DOCX or TXT up to 5 MB · we also audit it")}</span>
        </div>
        <input ref={fileInput} type="file" accept=".pdf,.docx,.txt,.md" hidden onChange={(e) => handleFiles(e.target.files)} />
      </div>

      <span className="eyebrow" style={{ marginTop: 20 }}>
        {t("Try an example")}
      </span>
      <div className="examples" style={{ marginTop: 0 }}>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="chip"
            onClick={() => {
              setQuery(ex);
              onSubmit(ex);
            }}
          >
            {ex.length > 42 ? `${ex.slice(0, 40)}…` : ex}
          </button>
        ))}
      </div>
    </div>
  );
}
