# AI Disclosure & Tooling Statement

---

## 1. AI Tools Used in Development
- **Coding Assistant**: Google DeepMind Antigravity / Gemini 2.5 Coding Agents for full-stack pair programming, test suite authoring, and documentation generation.
- **Design Translation**: Stitch UI mockup generation for initial HTML/PNG prototypes, converted into clean TypeScript React components and Tailwind CSS tokens.

---

## 2. Runtime AI Model & SDK
- **Runtime AI Provider**: Google Gemini API via the official `google-genai` Python SDK (v3.0.0+).
- **Default Model**: `gemini-2.5-flash` (configurable via `LLM_MODEL` environment variable).
- **Runtime Use Cases**:
  - `services/llm.py`: Structured claim extraction from ingested source chunks using `response_mime_type="application/json"` and `response_schema=ClaimsExtractionResponse`.
  - Offline Fallback: If `GEMINI_API_KEY` is not set or rate limits occur, the system falls back to `fixtures/claims_cache.json` with `origin="cache"` so the platform remains fully functional and honest about source origin.

---

## 3. Deterministic Trust Boundaries (Where AI is NOT Used)
To guarantee zero hallucinations and zero security leaks, the following critical components use **strictly deterministic Python code with zero AI involvement**:
1. **Quote Verification**: Whitespace and case-normalized exact substring matching (`services/verify.py`).
2. **Clearance & Privacy Enforcement**: Hard database query filters and pre-storage secret masking (`services/masking.py`, `services/permissions.py`).
3. **Approval Gates**: Strict rule-based checking for conflicting and missing claims before snapshot publishing (`routers/handover.py`).
4. **First 7 Days Onboarding Plan**: Deterministically mapped from active tasks, risks, and resolved items (`services/handover.py`).
