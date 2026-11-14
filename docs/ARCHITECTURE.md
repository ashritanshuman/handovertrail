# HandoverTrail Architecture

> **Evidence-First, Permission-Aware Knowledge Handover Platform**

---

## 1. System Overview & Data Flow

```mermaid
flowchart TD
    subgraph Client ["Frontend (React + Vite + Tailwind CSS)"]
        UI["SPA Interface (Dashboard, Review, Gaps, Handover)"]
        UserRole["Role Switcher (X-User-Id: riya | maya | arjun)"]
    end

    subgraph API ["FastAPI Backend (Port 8080)"]
        Auth["Security & Clearance Resolver (Level 1, 2, 3)"]
        
        subgraph Ingestion ["Ingestion & Pre-Storage Privacy"]
            Sources["Source Parsers (GitHub, Jira, Meeting Notes, Slack)"]
            Masking["Deterministic Masking (API Keys, Tokens, Phone Numbers)"]
        end

        subgraph Pipeline ["Processing Pipeline"]
            Extract["Claim Extraction (google-genai / Gemini 2.5 Flash / Offline Cache)"]
            Verify["Deterministic Verifier (Whitespace & Quote Substring Matcher)"]
            Conflicts["Conflict Engine (Rule-based Entity/Attribute Contradiction Resolver)"]
            Gaps["Gaps & Exit Interview Synthesizer"]
        end

        subgraph Delivery ["Snapshot & Delivery Engine"]
            Approval["Handover Approval Gate (Blockers check: Conflicting/Missing)"]
            Render["Render-Time Clearance Filter (Level 1 Successor vs Level 2 Lead)"]
        end
    end

    subgraph Storage ["Persistent Storage"]
        DB[("SQLite Database (WAL Mode)")]
        Cache[("On-Disk Extraction Cache (fixtures/claims_cache.json)")]
    end

    UI -->|HTTP Requests with X-User-Id| Auth
    Sources --> Masking
    Masking -->|Redacted Text & access_level 3| DB
    Auth --> Sources
    DB --> Extract
    Cache -.->|Fallback when no API key| Extract
    Extract --> Verify
    Verify --> Conflicts
    Conflicts --> Gaps
    Gaps --> DB
    Verify --> DB
    Approval --> DB
    DB --> Render
    Render --> UI
```

---

## 2. Key Architectural Decisions and Why

### 1. Deterministic Code Does All Verification (Zero LLM Trust for Truth)
- **Decision**: Claim status (`verified`, `inferred`, `conflicting`, `missing`) is determined strictly by deterministic Python algorithms without delegating truth decisions to an LLM.
- **Why**: LLMs readily hallucinate citations or claim confidence when quotes don't match. By enforcing that `verified` requires an exact normalized substring match against cited evidence, judges and engineers can trust the output 100%.

### 2. Multi-Tier Clearance Filtering at Query Time (Never 403 for Privileged Assets)
- **Decision**: In all database queries (`/api/evidence`, `/api/claims`, `/api/handover`, `/api/timeline`), filtering is applied at the query level (`access_level <= current_user.clearance`). Probing a higher-clearance ID returns `404 Not Found`, never `403 Forbidden`.
- **Why**: Returning `403 Forbidden` leaks metadata by confirming that a confidential document or secret exists. Returning `404` prevents the successor from even knowing privileged items exist.

### 3. Pre-Storage Privacy Masking
- **Decision**: Ingestion runs `services/masking.py` *before* records enter the SQLite database or are sent to any model. Raw tokens (`sk_live_...`, phone numbers) are masked as `[REDACTED:type]`, and any redacted unit is automatically elevated to `access_level 3`.
- **Why**: Defense in depth. Even if an LLM prompt or error trace were somehow exposed, the raw secrets do not exist in the database or server memory.

### 4. SQLite with Write-Ahead Logging (WAL)
- **Decision**: SQLite with WAL mode (`PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;`) instead of an external managed database.
- **Why**: Zero external infrastructure dependencies for hackathon judges and evaluation environments. WAL mode allows concurrent readers alongside a writer with microsecond latency.

### 5. Gemini 2.5 Flash via `google-genai` with Offline Cache Fallback
- **Decision**: Uses the official `google-genai` SDK with `gemini-2.5-flash` model, backed by an on-disk hash cache and `fixtures/claims_cache.json`.
- **Why**: The app runs completely offline without network or API key, while delivering high-speed live extraction with strict JSON schemas when `GEMINI_API_KEY` is present.

### 6. Single-Service Monorepo Deployment
- **Decision**: FastAPI serves both the REST API under `/api` and the built static frontend assets from `frontend/dist` with SPA client routing fallback to `index.html`.
- **Why**: Judges receive a single URL on Render/Railway. No CORS setup issues, zero deployment desynchronization.

---

## 3. Round 3: Conflict-Resolution & Exit-Interview Architecture

### 1. Multi-Attribute Deterministic Conflict Engine
- **Topics & Rules**:
  - `cg-api-key-rotation` (period): 30-day monthly rotation vs 90-day quarterly rotation.
  - `cg-owner-payment-recon` (owner): Riya sole-owner vs Maya assumed primary failover owner.
  - `cg-date-cert-cutover` (date): Nov 30 certificate expiration vs Nov 15 internal cutover deadline.
  - `cg-status-websocket-sse` (status/supersession): WebSocket deployed vs abandoned for SSE polling.
- **Supersession Hints**: Detects when a later decision or PR supersedes an older task, surfacing advice to the lead without auto-resolving.

### 2. Leaver Exit Interview (Riya)
- **Privacy & Pre-Storage Masking**: Leaver responses are passed through `services/masking.py` before hitting persistent storage, guaranteeing zero raw token leaks.
- **Attributed Level-2 Evidence**: Recorded answers generate new `EvidenceUnit` items (`source_type="exit_interview"`, `access_level=2`) visible only to Lead Maya and Leaver Riya, but hidden from Successor Arjun.
- **State Persistence**: Answers and skips are tracked across demo reloads in `questions` and audit logs (`interview_answered`, `interview_skipped`).

### 3. Lead Resolution Engine (Maya)
- **Atomic Operations**:
  - `chose_claim`: Marks chosen claim `confirmed`, `origin="human"`, increments version, reverifies deterministically, and marks other claims `rejected`.
  - `corrected`: Synthesizes a new human claim with combined evidence citations, increments version, and marks original claims `rejected`.
  - `dismiss`: Marks conflict `dismissed` with mandatory reason and recomputes verification on linked claims.
  - `leave_unresolved`: Marks conflict `unresolved` with mandatory note, blocking clean handover approval.
- **Approval Blocker**: `POST /api/approve` raises HTTP 409 Conflict if any conflict group is `open` or `unresolved`, unless `acknowledge_unresolved=True` is explicitly supplied.
