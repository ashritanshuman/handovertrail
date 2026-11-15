# HandoverTrail

> **An evidence-first, permission-aware knowledge handover platform that turns chaotic engineering transitions into verified, role-tailored institutional memory.**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini%202.5%20Flash-4285F4.svg?logo=google&logoColor=white)](https://ai.google.dev)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Railway-0B0D0E.svg?logo=railway&logoColor=white)](https://handovertrail.up.railway.app/)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E.svg?logo=railway&logoColor=white)](https://railway.com/)

🌐 **Live Deployment**: [https://handovertrail.up.railway.app/](https://handovertrail.up.railway.app/) (Railway) — Hosted as a unified single-container service (FastAPI + React SPA).

---

## 1. The Problem

When a key engineer resigns, months of undocumented architectural decisions, tribal knowledge, unreviewed pull requests, and hidden single points of failure walk out the door.

Existing AI summarization tools fail catastrophically in engineering handover:
- **Hallucinations**: Generative LLMs present plausible guesses as verified facts.
- **Permission Leaks**: Chat logs containing compensation talks, HR transition notes, or production secrets are exposed indiscriminately to incoming junior engineers.
- **No Verification**: Successors have no way to trace a stated policy back to the exact code review or meeting consensus where it was decided.
- **Uncontrolled Publishing**: Raw AI summaries are dumped directly onto successors without lead verification or sign-off.

---

## 2. The Solution & Features

HandoverTrail ingests project exports (Git, Jira, Meeting Notes, Slack), extracts structured claims (decisions, tasks, risks, dependencies, open questions, contacts), deterministically verifies every claim against exact source quotes, quarantines conflicts, redacts secrets, and requires human lead sign-off before a successor ever sees a word.

| Capability / Feature | Status | Description |
|---|---|---|
| **Multi-Source Ingestion** | **Built** | Normalizes Git issues/PRs/commits, Jira task boards, Markdown notes, and Slack exports. |
| **Server-Side Clearance Boundaries** | **Built** | Strict 3-level clearance (`1=Team`, `2=Lead-Only`, `3=Confidential`). Enforced server-side before return. |
| **Deterministic Quote Verifier** | **Built** | Pure Python engine checks verbatim substring containment. Status `verified` is never hallucinated. |
| **Planted Conflict Quarantining & Resolution** | **Built** | Detects conflicting statements across sources; provides atomic lead resolutions (`chose_claim`, `corrected`, `dismiss`, `leave-unresolved`). |
| **Autonomous Secret & PII Masking** | **Built** | Redacts API keys (`sk_live_...`) and phone numbers to `[REDACTED_API_KEY]` and `[REDACTED_PHONE]`. |
| **Knowledge Gap & Leaver Exit Interview** | **Built** | Synthesizes open questions from abandoned PRs and captures leaver answers with pre-storage masking and Level 2 evidence creation. |
| **Single-Owner Risk Detection** | **Built** | Flags critical modules authored solely by the departing engineer (e.g. Stripe payment reconciliation). |
| **First-7-Days Plan & Successor Preview** | **Built** | Deterministic rule-based 7-day onboarding plan with interactive checklist and mathematical Preview-as-Successor equivalence. |
| **Version History, Diffs & Audit Export** | **Built** | Semantic side-by-side claim diffing across versions, recipient acknowledgement tracking, and RFC 4180 CSV audit export. |
| **Defense-in-Depth Security Hardening** | **Built** | OWASP security headers, anti-caching, 2 MB body size limiter, sliding-window rate limiter, CSV formula protection, and non-root Docker execution. |
| **Lead Approval Gate** | **Built** | Freezes immutable versioned snapshot (`1.0.0`). Only leads can approve. |
| **Successor Onboarding & Acknowledgement** | **Built** | Role-tailored view for successors with cryptographic acknowledgement logging. |
| **Immutable Audit Trail** | **Built** | Tamper-evident log of all extractions, edits, approvals, and acknowledgements. |
| **Citations-Only Q&A (`/api/ask`)** | **Built** | Interactive assistant answering strictly from approved, permitted content with exact citations. |

> [!NOTE]
> Round 3 delivered all three major enhancements (Conflict Resolution & Exit Interview, Version History & Visual Diff, First-7-Days Plan & Preview-as-Successor) alongside a complete security audit ([SECURITY_REPORT.md](SECURITY_REPORT.md)). See [docs/ROUND3.md](docs/ROUND3.md) for details.

---

## 3. Complete Product Workflow

![HandoverTrail: Complete Product Workflow](docs/assets/product_workflow.png)

The end-to-end knowledge handover lifecycle coordinates four primary participants across 12 distinct stages:

1. **Team Lead (Maya)**: Connects source repositories (`1`), resolves quarantined cross-source contradictions (`6`), reviews and ratifies claims (`7`), formally approves the versioned handover snapshot (`8`), and conducts pre-flight successor previews and share audits before publication (`10`).
2. **Leaver (Riya)**: Undergoes permission-filtered AI reconstruction and provides ground-truth answers in the guided Exit Interview (`5`), which are transformed into attributed evidence units.
3. **System Engine**: Ingests and redacts secrets/PII (`2`), prompts LLM reconstruction over permitted evidence only (`3`), deterministically verifies verbatim quotes and clusters conflicts (`4`), and compiles the First-7-Days onboarding roadmap (`9`).
4. **Successor (Arjun)**: Receives the strictly role-filtered, approved handover dossier (`11`) and tracks Day 1–7 orientation progress with formal receipt acknowledgements (`12`).

> **Core Trust Rules**: Nothing shared before lead approval • Never verified without an exact quote • Confidential Level 3 items shown as aggregated count only • 100% synthetic data.

---

## 4. Architecture

```mermaid
flowchart TD
    subgraph Client["Presentation Layer (Single URL)"]
        UI["React + Vite + TypeScript + Tailwind CSS"]
        Switcher["User Perspective Switcher (Riya L2 | Maya L2 | Arjun L1)"]
    end

    subgraph Backend["FastAPI Backend (Port 8000)"]
        Security["Clearance Middleware (X-User-Id -> Level 1 / 2 / 3)"]
        
        subgraph CoreServices["Deterministic Core Services"]
            Ingest["ingest.py (Multi-Source Normalizer)"]
            Masking["masking.py (Regex Secret Redactor)"]
            Verifier["verify.py (Exact Substring Containment)"]
            Conflicts["conflicts.py (Contradiction Detector)"]
            Gaps["gaps.py (Orphan PR & Question Engine)"]
            HandoverSvc["handover.py (Immutable Snapshot Builder)"]
        end
        
        subgraph AIIntegration["AI Extraction Engine"]
            Gemini["Google Gemini API (gemini-2.5-flash via google-genai SDK)"]
            Cache["Deterministic Fallback Seed Cache"]
        end
    end

    subgraph Storage["Persistence Layer"]
        DB[("SQLite File DB (WAL Mode)")]
        StaticFiles["Static Distribution (frontend/dist)"]
    end

    UI -->|HTTP + Header X-User-Id| Security
    Security --> CoreServices
    CoreServices --> AIIntegration
    CoreServices --> DB
    Backend -->|Serves Single URL| StaticFiles
```

---

## 5. Tech Stack & Architectural Rationale

- **Frontend**:
  - `React 18 + Vite + TypeScript`: Ultra-fast HMR, type safety, and modern bundle optimization.
  - `Tailwind CSS + shadcn/ui patterns`: Clean, accessible, corporate-grade design system.
  - `Recharts`: Visual progress graphs, status breakdowns, and readiness indicators.
  - `Lucide React`: Consistent iconography.
- **Backend & Security**:
  - `Python 3.11 / 3.12 + FastAPI`: High-performance asynchronous API with automatic OpenAPI documentation.
  - `Pydantic v2`: Strict request/response validation, schema contracts, and serialization.
  - `SQLAlchemy 2 + SQLite`: File-based SQLite with WAL mode for zero-setup local execution and single-instance cloud hosting.
  - `pytest + pytest-asyncio`: End-to-end regression and permission test suites (61 tests, 86% coverage).
  - `Defense-in-Depth Middleware`: OWASP security headers (`nosniff`, `DENY`, `strict-origin-when-cross-origin`, strict CSP), anti-caching headers on `/api/*`, 2 MB payload size limiting, sliding-window rate limiting, and unprivileged non-root container user (`appuser`).
- **AI & Trust**:
  - `Google Gemini API (gemini-2.5-flash)`: Structured extraction with JSON schema output via the official `google-genai` SDK and deterministic seed fallback (`fixtures/claims_cache.json`).
  - `Deterministic Verifier`: Pure Python verification — **no LLM grades its own homework**.
- **Deployment**:
  - Single Railway web service: Multi-stage Docker container runs as non-root `appuser`. FastAPI serves the compiled React distribution from `frontend/dist` with client-side SPA routing fallback. Evaluators need only one URL.

---

## 6. Quick Start (Get Running in 60 Seconds)

### Prerequisites
- Python 3.11 or 3.12 (`python3.12 -m venv venv`)
- Node.js v18+ and npm

### One-Command Setup
```bash
# Clone repository
git clone https://github.com/ashritanshuman/handovertrail
cd handovertrail

# Complete setup (backend virtualenv + pip + frontend npm)
make setup
```

### Run Locally (Concurrently)
```bash
make dev
```
- Frontend UI: `http://localhost:5173`
- Backend API & OpenAPI Docs: `http://localhost:8000/api/docs`
- Health check: `http://localhost:8000/health`

### Run Backend Tests (61 Tests, 86% Line Coverage)
```bash
make test
```

### Seed Synthetic Demo Dataset
```bash
make seed
```

---

## 7. Demo Walkthrough ("Start Here" 4 Steps)

### Step 1: Ingest & The Three Clearance Realities
1. Open `http://localhost:5173`.
2. Notice the top-right user pill is set to **Maya Patel (Lead, Clearance Level 2)**.
3. Click **"Reset Demo"** to load the synthetic CampusConnect project (52 evidence units).
4. Switch to **Arjun Rao (Successor, Clearance Level 1)**.
   - Watch the Level 2 HR transition thread disappear completely from the view. The server filtered it out before dispatching the response.

### Step 2: Run Extraction & Deterministic Verification
1. Switch to **Riya Sharma (Leaver)** and click **"Run Extraction"**.
2. Notice status badges:
   - **Green (`Verified`)**: Exact source quote matched character-for-character in the ingested evidence.
   - **Yellow (`Inferred`)**: Extracted assertion without verbatim source quote.
   - **Red (`Conflicting`)**: Planted contradiction detected.

### Step 3: Resolve Planted Conflict & Abandoned PR
1. Filter claims by **"Conflicting"**:
   - Inspect **Claim #4**: Issue #42 says 30-day monthly rotation; Architecture Meeting says 90-day quarterly rotation.
2. Maya clicks to confirm quarterly rotation.
3. Inspect **Knowledge Gaps**:
   - Review the open gap on **PR #88** (WebSocket connection leak). Riya documents the SSE fallback in PR #94.

### Step 4: Final Sign-off & Successor Onboarding
1. Maya reviews the readiness percentage and approves handover version `1.0.0`.
2. Switch back to **Arjun Rao (Successor)**:
   - Handover tab unlocks with clean, role-appropriate documentation.
   - Arjun clicks **"Acknowledge Handover"**.
   - Review the immutable audit log under `/api/audit`.

---

## 8. How the Trust Model Works

1. **Permission-Before-Generation**:
   - Evidence units above a user's clearance level are stripped *before* entering LLM context and before returning over the network.
   - Confidential Level 3 secrets (e.g. `sk_live_...` and phone numbers) are masked deterministically.
2. **Deterministic Verification**:
   - The status `verified` is granted strictly by string containment:
     $$\text{status} = \begin{cases} \text{verified} & \text{if } \text{normalize}(\text{quote}) \subseteq \text{normalize}(\text{evidence}) \\ \text{inferred} & \text{otherwise} \end{cases}$$
3. **Lead Approval Gating**:
   - No draft claim or unverified inference can be viewed by successors until an authorized lead confirms the claims and freezes an immutable version snapshot.

---

## 9. Project Structure

```
handovertrail/
├── README.md               # Project documentation & guide
├── LICENSE                 # MIT License
├── Makefile                # make setup, dev, build, test, seed
├── .env.example            # Environment template
├── .gitignore              # Clean ignore rules
├── render.yaml             # Render single-service deployment
├── railway.json            # Railway deployment configuration
├── SECURITY_REPORT.md      # Comprehensive security audit & verification report
├── docs/
│   ├── assets/             # Diagram assets & workflow illustrations
│   ├── CONTRACT.md         # Single source of truth API & data contract
│   ├── ARCHITECTURE.md     # In-depth architectural design
│   ├── TESTING.md          # Test strategy & synthetic scenario tests
│   ├── CHANGES_FROM_PLAN.md# Architectural decisions & adjustments
│   ├── ROUND3.md           # Round 3 pitch & demo script
│   └── AI_DISCLOSURE.md    # AI and tools disclosure
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI application & static mounting
│   │   ├── config.py       # Pydantic settings
│   │   ├── db.py           # SQLAlchemy 2 engine & session
│   │   ├── models.py       # Database models
│   │   ├── schemas.py      # Pydantic v2 schemas
│   │   ├── security.py     # Clearance & X-User-Id resolution
│   │   ├── routers/        # Routers for all CONTRACT.md endpoints
│   │   ├── services/       # Core business logic & verifiers
│   │   └── fixtures/       # Database seed data loader
│   ├── tests/              # pytest test suite
│   └── requirements.txt    # Python dependencies
├── data/
│   └── demo/
│       ├── DATASET_SPEC.md # Specification of 52 evidence units
│       ├── github_export.json
│       ├── tasks.csv
│       ├── meeting_notes.md
│       └── slack_export.json
└── frontend/
    ├── src/
    │   ├── App.tsx         # Dashboard with user switcher & claims view
    │   ├── main.tsx        # React entrypoint
    │   ├── index.css       # Tailwind CSS
    │   └── types/          # TypeScript interfaces
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.js
```

---

## 10. Honest Limitations

- **Simulated Auth via Header**: For hackathon speed and zero-friction evaluator testing, user identity is switched via the `X-User-Id` header rather than OAuth2 SSO or session cookies.
- **Single-Node SQLite**: File-based SQLite with WAL mode is designed for single-node deployments; horizontal scaling requires migrating to PostgreSQL.
- **Substring Normalization**: Verifier matches case-insensitive normalized substrings; it does not yet perform semantic synonym matching (by design, to avoid semantic drift).

---

## 11. Team TchieSharks

- **Ashrit Anshuman Pradhan** - System Architecture, Backend & Verifier Engine
- **Kush Tayal** - Frontend UI/UX, Component Architecture & Analytics
- **Amreesh Sharma** - Data Engineering, Synthetic Planted Dataset & Security Audits

For details on tools and AI models used during development, see [docs/AI_DISCLOSURE.md](docs/AI_DISCLOSURE.md).

