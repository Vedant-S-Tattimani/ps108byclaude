import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { api } from "../api";
import type { StandardSummary } from "../types";
import { Pin } from "./art/Doodles";
import { CertBadge, ErrorBox } from "./ui";

type Props = { onOpen: (id: string) => void };

export function LibraryView({ onOpen }: Props) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [cert, setCert] = useState("");
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [items, setItems] = useState<StandardSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      api
        .standards(q, category, cert)
        .then((d) => !cancelled && (setItems(d), setError(null)))
        .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : "Could not load standards."));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [q, category, cert]);

  return (
    <div style={{ paddingBottom: 64 }}>
      <div className="filters">
        <label className="visually-hidden" htmlFor="lib-q">Search standards</label>
        <div style={{ position: "relative", flex: "1 1 260px", display: "flex" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: 14 }} aria-hidden />
          <input id="lib-q" className="input grow" style={{ paddingLeft: 36 }} placeholder="Search by number, title or keyword" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input" aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
          ))}
        </select>
        <select className="input" aria-label="Certification scheme" value={cert} onChange={(e) => setCert(e.target.value)}>
          <option value="">Any certification</option>
          <option value="ISI">ISI mark</option>
          <option value="CRS">CRS registration</option>
          <option value="Hallmarking">Hallmarking</option>
          <option value="None">None</option>
        </select>
      </div>
      {error && <ErrorBox message={error} />}
      {items && <p className="muted" style={{ fontSize: 13 }}>{items.length} standards</p>}
      <div className="lib-grid">
        {items?.map((s, i) => (
          <button type="button" className="lib-card paper hoverable" key={s.id} data-reveal="fade" style={{ ["--d" as string]: `${(i % 8) * 40}ms` }} onClick={() => onOpen(s.id)}>
            {i % 3 === 0 && <Pin colour={["var(--pin)", "#2f6fca", "#1c7c4a"][i % 3 === 0 ? (i / 3) % 3 : 0]} />}
            <span className="mono" style={{ fontSize: 15 }}>{s.designation}</span>
            <span className="title">{s.title}</span>
            <span className="muted" style={{ fontSize: 12 }}>{s.category}</span>
            <span><CertBadge cert={s.certification} /></span>
          </button>
        ))}
      </div>
    </div>
  );
}
