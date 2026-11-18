import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { api } from "../api";
import { useT } from "../i18n";

type Props = { query: string; standardId: string };

/** One-click officer feedback; each vote is a labelled example for tuning the engine. */
export function FeedbackBar({ query, standardId }: Props) {
  const t = useT();
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");
  const send = async (helpful: boolean) => {
    try {
      await api.feedback(query, standardId, helpful);
      setState("sent");
    } catch {
      setState("error");
    }
  };
  if (state === "sent") return <p className="feedback-bar hand" role="status">thanks, noted for tuning ✓</p>;
  return (
    <div className="feedback-bar">
      <span>{t("Was this the right standard?")}</span>
      <button type="button" className="chip" aria-label={`Yes, ${standardId} is right`} onClick={() => send(true)}><ThumbsUp size={14} /></button>
      <button type="button" className="chip" aria-label={`No, ${standardId} is wrong`} onClick={() => send(false)}><ThumbsDown size={14} /></button>
      {state === "error" && <span className="muted">Could not save, try again.</span>}
    </div>
  );
}
