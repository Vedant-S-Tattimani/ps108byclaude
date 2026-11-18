const ENDPOINTS = [
  { method: "POST", path: "/api/recommend", text: "Description or spec text (any supported language) → ranked standards, allied standards, certification and a draft clause." },
  { method: "POST", path: "/api/recommend/upload", text: "Multipart PDF / DOCX / TXT tender → extracted text, recommendations and a specification audit." },
  { method: "POST", path: "/api/recommend/batch", text: "Up to 25 tender / BOQ line items → the best standard, confidence and certification for each." },
  { method: "GET", path: "/api/updates?since=2020", text: "Standards revised or amended since a year: feeds watchlists and revision alerts." },
  { method: "GET", path: "/api/certificate/check", text: "Format check for a CM/L licence, CRS R-number or HUID, with the official verification route." },
  { method: "POST", path: "/api/feedback", text: "Officer marks a recommendation right or wrong; votes become training data." },
  { method: "POST", path: "/api/audit", text: "Draft specification → outdated, undated, unknown and missing references with fixes and a score." },
  { method: "GET", path: "/api/standards", text: "Search the knowledge base by text, category and certification scheme." },
  { method: "GET", path: "/api/standards/{id}", text: "One standard with versions, amendments and its reference graph in both directions." },
  { method: "GET", path: "/api/health", text: "Liveness, knowledge-base size and whether the NVIDIA Nemotron layer is on (provider and model)." },
];

const WIDGET = `<!-- Any portal page: one script tag + one attribute -->
<script src="https://<specsetu-host>/widget.js" defer></script>
<textarea data-specsetu name="technical_spec"></textarea>`;

const CURL = `curl -X POST http://localhost:8000/api/recommend \\
  -H "Content-Type: application/json" \\
  -d '{"query": "LED street light 90W IP66", "top_k": 3}'`;

const JS = `// Inside a portal's item-specification form
const res = await fetch("/api/recommend", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: itemDescription.value, top_k: 3 }),
});
const { success, data, error } = await res.json();
if (success) {
  specField.value = data.clause;          // pre-fill the technical spec
  showStandards(data.recommendations);    // IS numbers with latest versions
  flagCertification(data.certifications); // ISI / CRS / Hallmark warnings
}`;

const RESPONSE = `{
  "success": true,
  "data": {
    "recommendations": [{ "designation": "IS 10322 (Part 5/Sec 3):2012",
      "confidence": 96, "certification": { "scheme": "CRS", "mandatory": true } }],
    "allied": [{ "type": "test_method", "items": [{ "designation": "IS 16106:2012" }] }],
    "clause": "TECHNICAL SPECIFICATION - ..."
  },
  "error": null
}`;

export function ApiView() {
  return (
    <div className="two-col" style={{ paddingBottom: 64 }}>
      <section className="paper pad">
        <span className="eyebrow">Plug into any e-procurement portal</span>
        <h2 style={{ fontSize: 22, marginBottom: 6 }}>REST API</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Every screen in this app runs on these endpoints. Each response uses one envelope: <span className="mono">success</span>, <span className="mono">data</span>, <span className="mono">error</span>. Interactive docs are at <a href="/docs" target="_blank" rel="noopener noreferrer">/docs</a> on the API server.
        </p>
        {ENDPOINTS.map((e) => (
          <div className="endpoint" key={e.path}>
            <span className={`method ${e.method.toLowerCase()}`}>{e.method}</span>
            <div>
              <span className="mono">{e.path}</span>
              <div className="muted" style={{ fontSize: 13 }}>{e.text}</div>
            </div>
          </div>
        ))}
      </section>
      <section className="stack">
        <div className="paper pad" data-testid="widget-panel">
          <span className="eyebrow">Drop-in widget · zero integration work</span>
          <p style={{ marginTop: 0 }}>Adds a <b>Suggest Indian Standards</b> button under any spec textarea on GeM, CPPP or a state portal, with an <b>Insert clause</b> action.</p>
          <pre className="code">{WIDGET}</pre>
          <p style={{ marginBottom: 0 }}><a href="/widget-demo" target="_blank" rel="noopener noreferrer">Open the live widget demo on a sample portal form →</a></p>
        </div>
        <div>
          <span className="eyebrow">Request</span>
          <pre className="code">{CURL}</pre>
        </div>
        <div>
          <span className="eyebrow">Portal integration (spec form autofill)</span>
          <pre className="code">{JS}</pre>
        </div>
        <div>
          <span className="eyebrow">Response (trimmed)</span>
          <pre className="code">{RESPONSE}</pre>
        </div>
      </section>
    </div>
  );
}
