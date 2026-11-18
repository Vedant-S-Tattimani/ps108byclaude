import type { AuditResult, CertificateCheck, Health, RecommendResult, StandardDetail, StandardSummary, UpdateRow, UploadResult } from "./types";

interface Envelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta: Record<string, unknown>;
}

const BASE = import.meta.env.VITE_API_BASE ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, init);
  } catch {
    throw new Error("Cannot reach the SpecSetu API. Is the backend running on port 8000?");
  }
  let body: Envelope<T>;
  try {
    body = (await response.json()) as Envelope<T>;
  } catch {
    throw new Error(`The server answered with status ${response.status} and no readable body.`);
  }
  if (!body.success || body.data === null) {
    throw new Error(body.error ?? "The request failed.");
  }
  return body.data;
}

const json = (payload: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

export const api = {
  health: () => request<Health>("/api/health"),
  recommend: (query: string, topK = 5) => request<RecommendResult>("/api/recommend", json({ query, top_k: topK })),
  audit: (text: string) => request<AuditResult>("/api/audit", json({ text })),
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<UploadResult>("/api/recommend/upload", { method: "POST", body: form });
  },
  standards: (q = "", category = "", certification = "") => {
    const params = new URLSearchParams({ q, category, certification });
    return request<StandardSummary[]>(`/api/standards?${params}`);
  },
  standard: (id: string) => request<StandardDetail>(`/api/standards/${encodeURIComponent(id)}`),
  updates: (since: number) => request<UpdateRow[]>(`/api/updates?since=${since}`),
  feedback: (query: string, standardId: string, helpful: boolean) =>
    request<{ ts: number }>("/api/feedback", json({ query, standard_id: standardId, helpful })),
  certificate: (number: string) => request<CertificateCheck>(`/api/certificate/check?number=${encodeURIComponent(number)}`),
  categories: () => request<{ name: string; count: number }[]>("/api/categories"),
};
