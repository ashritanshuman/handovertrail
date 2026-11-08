# HandoverTrail Architecture

> **Evidence-First, Permission-Aware Knowledge Handover Platform**

```
+-----------------------------------------------------------------------------------+
|                                  USER INTERFACE                                   |
|   React + Vite + TypeScript + Tailwind CSS + shadcn/ui + Recharts + lucide-react   |
|   [Simulated User Switcher: Riya (Leaver L2) | Maya (Lead L2) | Arjun (Succ L1)]  |
+-----------------------------------------------------------------------------------+
                                         |  HTTP / REST (Header: X-User-Id)
                                         v
+-----------------------------------------------------------------------------------+
|                                FASTAPI BACKEND                                    |
|                                                                                   |
|  [Security & Clearance Middleware / Resolver]                                     |
|    - Validates X-User-Id header -> User context (Role, Clearance 1/2/3)           |
|    - Server-side access filtering BEFORE database return                          |
|                                                                                   |
|  [Routers]                                                                        |
|    /api/demo    /api/project   /api/evidence   /api/extract   /api/claims         |
|    /api/gaps    /api/timeline  /api/stats      /api/approve   /api/handover       |
|    /api/acknowledge            /api/audit      /api/ask                           |
|                                                                                   |
|  [Core Services]                                                                  |
|    +--------------------+  +--------------------+  +--------------------+         |
|    |     Ingest         |  |    Permissions     |  |      Masking       |         |
|    | Multi-source parse |  | Level 1 / 2 / 3    |  | Deterministic PII/ |         |
|    | (JSON, CSV, MD)    |  | pre-filter engine  |  | Secret Redactor    |         |
|    +--------------------+  +--------------------+  +--------------------+         |
|    +--------------------+  +--------------------+  +--------------------+         |
|    |    Extraction      |  |    Verification    |  |     Conflicts      |         |
|    | Claude Tool-Use /  |  | Exact Substring    |  | Cross-evidence     |         |
|    | JSON-Schema Prompt |  | Quote Matcher      |  | Contradiction Det. |         |
|    +--------------------+  +--------------------+  +--------------------+         |
|    +--------------------+  +--------------------+                                 |
|    |        Gaps        |  |      Handover      |                                 |
|    | Question synthesis |  | Immutable Snapshot |                                 |
|    | & answer tracker   |  | & Sign-off Engine  |                                 |
|    +--------------------+  +--------------------+                                 |
+-----------------------------------------------------------------------------------+
       |                                                    |
       v                                                    v
+-----------------------------+               +-----------------------------+
|    STORAGE: SQLite (WAL)    |               |         AI PROVIDER         |
|  SQLAlchemy 2 Async / Sync  |               | Anthropic Claude Sonnet 5.5 |
|  Deterministic Tables & FKs |               | Strict JSON-Schema Output   |
+-----------------------------+               +-----------------------------+
```

---

## 1. System Philosophy

HandoverTrail addresses the fatal flaw of traditional AI documentation tools: **hallucinated institutional memory and credential leaks**.
In high-stakes corporate engineering handovers, an incoming engineer cannot afford to guess whether a documented password rotation, single-owner module, or architectural decision was an actual engineering consensus or a generative hallucination.

### Pillars:
1. **Verifiable Ground Truth**: A claim is `verified` if and only if deterministic Python code locates an exact, non-empty, case-insensitive normalized substring in an ingested evidence unit.
2. **Permission Boundary Before Generation**: LLM prompts never receive evidence above the leaver's or project's target clearance level. Confidential secrets (Level 3) are redacted *before* AI extraction.
3. **Lead Sign-off Gate**: Incoming successors (Level 1) can only view finalized claims from an immutable, cryptographically timestamped snapshot approved by an engineering lead (`maya`).

---

## 2. Component Layers

### A. Presentation Layer (Frontend)
- **Framework**: React 18, Vite, TypeScript.
- **Styling & UI**: Tailwind CSS, shadcn/ui design patterns, Lucide icons.
- **Analytics & Visuals**: Recharts for readiness progress, claim breakdown by status/type, and timeline views.
- **User Simulator**: Persistent `X-User-Id` selector in the top bar to instantly demonstrate view variance across `Riya` (Leaver, L2), `Maya` (Lead, L2), and `Arjun` (Successor, L1).

### B. API Gateway & Security Layer
- **Framework**: FastAPI with Pydantic v2 schemas.
- **Clearance Enforcement Dependency**: `get_current_user` extracts `X-User-Id`, resolves role and clearance level (`1=Team`, `2=Lead`, `3=Confidential`).
- **Audit Logging**: Every mutation (`extract`, `claim edit`, `gap answer`, `approve`, `acknowledge`) commits an immutable entry into `audit_log`.

### C. Services & Business Logic

1. **`ingest.py`**:
   - Parses multi-format project dumps: Git commits/PRs/issues (`JSON`), Jira/Linear boards (`CSV`), engineering meeting notes (`Markdown`), and chat exports (`JSON`).
   - Normalizes each source item into an `EvidenceUnit` with source reference, timestamp, author, and intrinsic access level.

2. **`masking.py`**:
   - Deterministic regex and pattern-matching redactor.
   - Detects API keys (`sk_live_...`, AWS keys, tokens) and PII (phone numbers, personal emails, salary tags).
   - Replaces with safe redaction tokens (`[REDACTED_API_KEY]`, `[REDACTED_PHONE]`).

3. **`extract.py`**:
   - Anthropic Claude integration (`claude-sonnet-5-5` or configured `LLM_MODEL`).
   - Calls Claude with strict JSON-schema tool output requesting structured claims (decisions, tasks, risks, dependencies, open questions, contacts) paired with supporting quotes.
   - Includes deterministic offline cache fallback for immediate offline hackathon demo reproducibility.

4. **`verify.py`**:
   - Purely deterministic verification algorithm:
     - Normalizes whitespace, quotes, and punctuation.
     - Performs exact containment check `quote in evidence_unit.text`.
     - Assigns status: `verified` if exact match found; `inferred` if synthesized without quote; `conflicting` if marked by conflict detector.

5. **`conflicts.py`**:
   - Compares claims against divergent evidence units.
   - Flags planted discrepancies (e.g., 30-day monthly vs 90-day quarterly API rotation).

6. **`permissions.py`**:
   - Filters collections (`List[EvidenceUnit]`, `List[Claim]`, `HandoverSnapshot`) against `user.clearance`.
   - Strips or suppresses entities above the user's privilege.

7. **`gaps.py`**:
   - Synthesizes open questions from unresolved PR comments (e.g. PR #88 socket leak) and missing documentation areas.
   - Facilitates asynchronous leaver Q&A.

8. **`handover.py`**:
   - Compiles finalized claims and metrics into a frozen JSON snapshot.
   - Records lead signature, timestamp, and enables successor onboarding flow.

---

## 3. Data Flow & Security Boundary

```
[Raw Sources: Git, Jira, Notes, Chat]
                 |
                 v
         [ingest.py (Parse)]
                 |
                 v
        [masking.py (Redact Level 3 Tokens)]
                 |
                 +--------------------------------------+
                 | (Filtered by Leaver Clearance Level) |
                 v                                      v
       [Deterministic Cache]                  [Claude Sonnet 5.5]
                 |                                      |
                 +------------------+-------------------+
                                    v
                          [Unverified Claims]
                                    |
                                    v
                     [verify.py & conflicts.py]
                   (Deterministic Quote Matching)
                                    |
            +-----------------------+-----------------------+
            |                       |                       |
       [verified]              [conflicting]           [inferred]
            |                       |                       |
            +-----------------------+-----------------------+
                                    v
                         [Lead Review / Edit]
                                    |
                           [POST /api/approve]
                                    |
                                    v
                     [Approved Handover Snapshot]
                                    |
                                    v
                        [GET /api/handover (L1)]
                                    |
                                    v
                       [Successor Acknowledges]
```

---

## 4. Single-Service Production Deployment

For hackathon evaluation on Render/Railway:
- The React application is compiled into static distribution files in `frontend/dist`.
- FastAPI mounts `frontend/dist` as a static directory and provides a catch-all route serving `index.html` for client-side routing.
- This guarantees **judges access a single URL** containing the fully functioning web application and API without multi-host CORS or deployment coordination friction.
