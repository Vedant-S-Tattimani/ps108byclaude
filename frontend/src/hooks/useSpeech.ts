import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
}

type RecognitionCtor = new () => SpeechRecognitionLike;

function getRecognition(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Browser speech-to-text (Chrome/Edge). Supports Indian locales such as hi-IN, ta-IN, en-IN. */
export function useSpeech(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const supported = getRecognition() !== null;

  useEffect(() => () => recognition.current?.stop(), []);

  const start = useCallback(
    (lang: string) => {
      const Ctor = getRecognition();
      if (!Ctor) {
        setError("Voice input needs Chrome or Edge.");
        return;
      }
      const rec = new Ctor();
      rec.lang = lang;
      rec.interimResults = false;
      rec.continuous = false;
      rec.onresult = (event) => {
        const text = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join(" ");
        onText(text);
      };
      rec.onerror = (event) => setError(event.error === "not-allowed" ? "Microphone permission was denied." : `Voice input stopped: ${event.error}`);
      rec.onend = () => setListening(false);
      recognition.current = rec;
      setError(null);
      setListening(true);
      rec.start();
    },
    [onText],
  );

  const stop = useCallback(() => recognition.current?.stop(), []);

  return { supported, listening, error, start, stop };
}
