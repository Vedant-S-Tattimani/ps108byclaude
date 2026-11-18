export type CertScheme = "ISI" | "CRS" | "Hallmarking" | "None";

export interface Certification {
  scheme: CertScheme;
  mandatory: boolean;
  instrument: string;
}

export interface Amendment {
  no: number;
  year: number;
}

export interface StandardSummary {
  id: string;
  number: string;
  year: number;
  designation: string;
  title: string;
  scope: string;
  category: string;
  ics: string;
  status: string;
  kind: string;
  amendments: Amendment[];
  latest_amendment: Amendment | null;
  previous_versions: number[];
  certification: Certification;
  keywords: string[];
  official_url: string;
}

export interface ChecklistItem {
  name: string;
  present: boolean;
  value: string | null;
}

export interface SpecChecklist {
  category: string;
  items: ChecklistItem[];
  stated: number;
  total: number;
  completeness: number;
}

export interface UpdateRow extends StandardSummary {
  changes: { year: number; change: string }[];
  last_changed: number;
}

export interface CertificateCheck {
  number: string;
  type: string;
  valid_format: boolean;
  how_to_verify: string;
  links: string[];
}

export interface Recommendation extends StandardSummary {
  rank: number;
  score: number;
  confidence: number;
  signals: { lexical: number; semantic: number; fuzzy: number; concept: number; keyword_bonus: number };
  reasons: string[];
}

export interface AlliedItem extends StandardSummary {
  relation: string;
  via: string;
}

export interface AlliedGroup {
  type: string;
  label: string;
  items: AlliedItem[];
}

export interface CertificationNote {
  standard: string;
  standard_id: string;
  scheme: CertScheme;
  mandatory: boolean;
  instrument: string;
  guidance: string;
}

export interface RecommendResult {
  query: string;
  recommendations: Recommendation[];
  allied: AlliedGroup[];
  certifications: CertificationNote[];
  concepts_detected: string[];
  low_confidence: boolean;
  language: { code: string; name: string; english_query: string; glossary_hits: string[]; untranslated: string[] };
  parameters: { type: string; value: string }[];
  clause: string;
  spec_checklist: SpecChecklist | null;
  engine: string;
  elapsed_ms: number;
}

export type Severity = "high" | "medium" | "low" | "ok";

export interface Finding {
  severity: Severity;
  type: string;
  title: string;
  detail: string;
  citation: string;
  fix: string;
}

export interface AuditResult {
  score: number;
  grade: string;
  counts: Record<Severity, number>;
  findings: Finding[];
  suggested: Recommendation[];
}

export interface LineItem {
  item: string;
  matched: boolean;
  standard: Pick<Recommendation, "id" | "designation" | "title" | "confidence" | "certification" | "latest_amendment">;
  alternatives: string[];
}

export interface UploadResult {
  filename: string;
  characters: number;
  excerpt: string;
  recommendation: RecommendResult;
  audit: AuditResult;
  items: LineItem[];
}

export interface StandardDetail extends StandardSummary {
  relations: (StandardSummary & { relation: string })[];
  referenced_by: (StandardSummary & { relation: string })[];
}

export interface Health {
  status: string;
  standards: number;
  llm_enabled: boolean;
  llm_provider: string | null;
  llm_model: string | null;
  version: string;
}
