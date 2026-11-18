import { useCallback, useEffect, useState } from "react";

const KEY = "specsetu.watchlist";
const EVENT = "specsetu:watchlist";

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Standards the officer is tracking for revisions and amendments (kept in this browser). */
export function useWatchlist() {
  const [ids, setIds] = useState<string[]>(read);

  useEffect(() => {
    const sync = () => setIds(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const current = read();
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable (private mode): keep the in-memory list for this session */
    }
    setIds(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { ids, isWatched: (id: string) => ids.includes(id), toggle };
}
