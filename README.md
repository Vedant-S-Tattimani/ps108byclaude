# SpecSetu — the bridge from procurement specs to Indian Standards

*Setu* means bridge. SpecSetu is a prototype for problem statement **26108** (Ministry of Consumer Affairs, Food & Public Distribution · Department of Consumer Affairs · Smart Automation).

A procurement officer describes an item — in English or one of nine Indian scripts, by typing, speaking or uploading a tender — and SpecSetu returns the applicable Indian Standard, its latest version and amendments, the allied standards to cite with it, the BIS certification bidders must hold, and a tender clause ready to paste.

## Requirement coverage

Every expected feature in the problem statement, where it lives, and the automated tests that prove it.

| # | Requirement | How SpecSetu meets it | Verified by |
|---|---|---|---|
| R1 | Accept product descriptions, technical specifications or tender documents | Free text, voice input, and PDF / DOCX / TXT upload. Uploaded tenders are split into line items (numbered lines, bullets, DOCX table rows; boilerplate like EMD skipped) and each item gets its own standard. `POST /api/recommend/batch` takes a whole BOQ. | `test_requirements.py::test_r1_*`, E2E `R1 ·` |
| R2 | Semantic understanding, not keyword matching | Hybrid engine: concept graph + TF-IDF + latent semantic analysis + character n-grams. *geyser → IS 2082*, *saria → IS 1786*, *cabel → IS 694*, plain questions work. Low-confidence results are flagged. | `test_r2_*`, `test_engine.py`, E2E `R2 ·` |
| R3 | Allied standards: normative references, test methods, terminology, safety, installation, related products | Reference graph per standard, grouped into 7 relation types plus sampling plans, shown as a clickable map and list. | `test_r3_*`, E2E `R3 ·` |
| R4 | Latest published version and amendments | Every result shows year, latest amendment, superseded versions and a version timeline. Spec audit flags outdated or undated IS citations. | `test_r4_*`, `test_audit_*`, E2E `R4 ·` |
| R5 | Mandatory certification (BIS product certification, CRS, Hallmarking) | ISI mark under QCOs, CRS for electronics and solar, Hallmarking + HUID, each with the notifying order and what to ask bidders for. Rubber-stamped "Mandatory" in the UI and written into the clause. | `test_r5_*`, E2E `R5 ·` |
| R6 | Multilingual input and natural-language queries | Script detection for Hindi/Marathi, Bengali, Gujarati, Punjabi, Odia, Tamil, Telugu, Kannada and Malayalam with an offline procurement glossary for each; Indic digits normalised (૫૩ → 53). Voice input in five Indian locales. Optional NVIDIA Nemotron layer translates any language (verified live with Assamese). | `test_r6_*` (10 scripts), E2E `R6 ·` |
| — | Integrate with procurement portals | REST API with a single response envelope, CORS, input validation and rate limiting; batch endpoint for BOQs; Portal API page with copy-ready snippets. | `test_api.py`, `test_portal_batch_*` |
| — | Prevent ambiguous or disputed tenders | Spec audit: outdated / undated / unknown references, missing applicable standard, missing certification, test methods and sampling clauses, with a 0–100 score and fixes. | `test_audit_*`, E2E `Spec audit` |

## Added after benchmarking existing platforms

Compared with BIS Know Your Standard / e-BIS, the BIS Care app, GeM, CPPP, Accuris Engineering Workbench and ASTM Compass (full comparison in [docs/SpecSetu-Report.pdf](docs/SpecSetu-Report.pdf)):

| Gap | Seen in | Built |
|---|---|---|
| Revision tracking | Accuris alerts | Watchlist + "What changed" feed (`GET /api/updates`) |
| Key parameters of the spec | GeM golden parameters | Per-category checklist; missing ones become blanks in the clause |
| Certificate checks | BIS Care, GeM validation | CM/L, R-number, HUID format check + official verification links (`GET /api/certificate/check`) |
| Link to the official standard | BIS Know Your Standard | "Open on BIS" on every standard |
| Learning from users | Commercial AI search | Right / wrong votes (`POST /api/feedback`, `GET /api/feedback/summary`) |
| Integration effort | GeM–BIS data link | Drop-in widget: `<script src="/widget.js">` + `data-specsetu` (demo at `/widget-demo`) |
| Bidder compliance statement | Tender practice | One-click clause-by-clause compliance sheet (CSV) |
| Hindi interface | BIS, GeM | EN / हिं toggle |

## Repository layout

```
backend/                     FastAPI service (Python 3.11+)
  app/
    main.py                  create_app(), routes, error envelope, rate limiting
    config.py                settings from environment variables
    schemas.py               request models + {success, data, error, meta} envelope
    data/standards.json      knowledge base: 82 standards, versions, amendments, certification, relations
    data/lexicon.json        procurement concept graph + glossaries for 9 Indian scripts
    services/
      repository.py          standards repository, IS reference parsing
      engine.py              hybrid semantic retrieval (TF-IDF + LSA + char n-grams + concept graph)
      language.py            script detection, digit normalisation, glossary translation
      extractor.py           PDF / DOCX / TXT extraction, tender line-item splitting, parameter detection
      auditor.py             specification health check
      clause.py              tender clause drafting
      llm.py                 optional NVIDIA Nemotron (NIM API) re-ranking and any-language translation
      recommender.py         orchestration
  tests/                     92 pytest tests (engine, language, audit, API, requirements, features, Nemotron)
  app/static/                widget.js (drop-in portal widget) and widget-demo.html
frontend/                    React 18 + TypeScript + Vite
  src/
    App.tsx                  shell and routing (Find standards · Spec audit · Library · Portal API)
    components/landing/      hero, how it works, case files, FAQ, closing banner
    components/art/          hand-drawn SVG doodles, pins, clips, scenes (original artwork)
    components/              QueryPanel, ResultsView, RecommendationCard, AlliedGraph, TenderItems,
                             StandardDrawer, AuditView, LibraryView, ApiView, Dock
    hooks/                   useMotion (scroll reveals, pointer parallax), useSpeech (voice input)
    styles/                  tokens, paper primitives, sections, tool views, motion, responsive
  e2e/                       Playwright end-to-end suite: 46 tests (desktop + phone)
docs/
  SpecSetu-Report.pdf        product report: USPs, MVP, benchmark, gap analysis, roadmap
  report/                    report source (HTML), screenshots and capture script
```

## Run it

Backend (port 8000):

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000
```

Frontend (port 5173, proxies `/api` to the backend):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. API docs are at http://localhost:8000/docs.

## Tests

Backend unit, integration and requirement tests:

```bash
cd backend
python -m pytest
```

End-to-end tests in a real browser. They use the installed Google Chrome (`PW_CHANNEL=msedge` for Edge) and start both servers themselves if they are not already running:

```bash
cd frontend
npx playwright test
```

The HTML report is written to `frontend/e2e-report/`.

## How the recommendation works

| Signal | Weight | What it catches |
|---|---|---|
| Concept graph | 0.30 | Everyday words mapped to standard concepts: *geyser → water heater*, *saria → reinforcement steel*, *tube light → LED luminaire* |
| Word TF-IDF on the concept-expanded query | 0.38 | Precise terms in titles, scopes and keywords |
| Latent semantic analysis (SVD) | 0.17 | Co-occurrence meaning between descriptions and scopes |
| Character n-grams | 0.15 | Typos and spelling variants (*cabel*, *galvanised*) |

Product specifications outrank test methods and codes of practice unless the query asks for them; those appear as allied standards instead. Confidence is a calibrated score damped by distance from the best match.

### Optional AI layer: NVIDIA Nemotron

Put an NVIDIA API key (starts with `nvapi-`, from build.nvidia.com) in `backend/.env` — copy `backend/.env.example`. The backend then calls the NVIDIA NIM API (`https://integrate.api.nvidia.com/v1`, OpenAI-compatible) with `nvidia/nemotron-3.5-lightning-30b-a3b` (about 1 s per search) to:

- translate any language the offline glossary misses, **before** retrieval;
- re-rank the shortlist and write a one-line reason per standard.

`/api/health` reports `llm_enabled`, `llm_provider` and `llm_model`; result cards show "+ NVIDIA Nemotron re-ranking" in the engine line. Any failure (network, bad key, rate limit, non-JSON reply) falls back to the offline engine, and the client retries without structured-output options if a model rejects them. Change the model with `LLM_MODEL` (e.g. `nvidia/nemotron-3-ultra-550b-a55b`). Tests never call the live API: backend tests force `ENABLE_LLM=false` and mock the NIM endpoint; the E2E suite runs its own servers on ports 8001/5174 with the AI layer off.

## Portal API

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/recommend` | description → standards, allied, certification, clause |
| POST | `/api/recommend/upload` | PDF/DOCX/TXT → line items, recommendations, audit |
| POST | `/api/recommend/batch` | up to 25 BOQ items → best standard and certification for each |
| POST | `/api/audit` | draft spec → findings and score |
| GET | `/api/standards` | search by text, category, certification |
| GET | `/api/standards/{id}` | one standard with its reference graph |
| GET | `/api/updates?since=2020` | revisions and amendments since a year |
| GET | `/api/certificate/check?number=` | CM/L, R-number or HUID format + verification route |
| POST | `/api/feedback` | officer vote on a recommendation |
| GET | `/widget.js` | drop-in portal widget |
| GET | `/api/health` | status |

## Limits of this prototype

- `standards.json` is a **curated sample** of 82 standards. Titles, years, amendment numbers and QCO coverage are indicative and must be checked against the BIS Standards portal before real use. Production would sync the full BIS catalogue and its normative-reference lists.
- The offline glossaries cover common procurement words; uncommon words need the Nemotron layer.
- PDF extraction reads text PDFs only; scanned tenders need OCR.
- The rate limiter is in-memory; use Redis for multiple instances.
