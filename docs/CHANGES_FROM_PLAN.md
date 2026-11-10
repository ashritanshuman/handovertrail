# Changes from Original Plan

This document transparently notes all architectural and implementation decisions where HandoverTrail deliberately adapted its initial proposal to improve reliability, speed, and evaluation reproducibility.

---

## 1. Direct Clearance-Filtered Retrieval Instead of pgvector
- **Original Plan**: Store evidence embeddings in a `pgvector` PostgreSQL instance and run semantic similarity vector searches for claim retrieval and Q&A.
- **Change**: Replaced `pgvector` with permission-filtered direct database retrieval and keyword/substring matching against SQLite.
- **Why**:
  1. The project dataset consists of ~50–100 evidence units, where full relational scans execute in `< 1ms`.
  2. Running a dedicated PostgreSQL container with `pgvector` adds significant operational fragility, cold starts, and complex dependencies during judging.
  3. Strict permission filtering is simpler and safer to enforce deterministically in SQL (`WHERE access_level <= clearance`) than filtering approximate vector search k-NN candidate pools.

---

## 2. Seeded Identity Simulation (`X-User-Id`) Instead of OAuth
- **Original Plan**: Integrate OAuth2 / OpenID Connect provider for Google or GitHub single-sign-on.
- **Change**: Seeded personas (`riya`, `maya`, `arjun`) switched instantaneously via the `X-User-Id` request header and UI dropdown switcher.
- **Why**:
  1. Evaluating permission differences requires judges to seamlessly switch viewpoints (e.g., viewing as Maya with Clearance 2 vs Arjun with Clearance 1) in one click without logging out and logging back into different Google accounts.
  2. Eliminates external OAuth redirect latency, cookie management issues, and token expiration during hackathon judging.

---

## 3. Google Gemini 2.5 Flash via `google-genai` SDK
- **Original Plan**: Anthropic Claude API for claim extraction.
- **Change**: Standardized on Google Gemini (`gemini-2.5-flash`) via the official `google-genai` SDK, with strict Pydantic JSON schema generation and deterministic offline cache fallback (`fixtures/claims_cache.json`).
- **Why**:
  1. Gemini 2.5 Flash provides ultra-fast inference with strict structured outputs conforming to Pydantic schemas.
  2. Ensures the platform runs 100% reliably out of the box even when `GEMINI_API_KEY` is not provided.

---

## 4. Single-Service Monorepo Deployment
- **Original Plan**: Separate frontend Vercel deployment and backend Render web service.
- **Change**: Single unified web service where FastAPI serves `frontend/dist` with SPA client-side fallback.
- **Why**: Eliminates CORS errors, cookie domain mismatches, and double cold-starts. Judges test one link.
