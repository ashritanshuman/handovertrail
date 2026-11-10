# HandoverTrail Bug Fix & QA Audit Report

This document records all bugs identified, investigated, and fixed during the pre-deadline stabilization audit of **HandoverTrail**.

---

## 1. Resolved Bug Registry

| ID | Severity | Area | Symptom | Root Cause | Fix Commit | Verification |
|---|---|---|---|---|---|---|
| **BUG-001** | **P0** | Backend API | Calling `GET /api/claims/{id}/evidence` returned `404 Not Found`. | Evidence was only nested in `GET /api/claims/{id}`; no dedicated sub-resource route existed, and case-sensitive ID queries failed. | `d99a007` | Verified via TestClient and curl across all 14 claims in both lower and upper case (`clm-001` & `CLM-001`). |
| **BUG-002** | **P0** | Backend API | Calling `POST /api/handover/approve` or `/api/handover/acknowledge` returned `405 Method Not Allowed`. | Routes were registered exclusively at `/api/approve` and `/api/acknowledge`. | `d99a007` | Added dual path decorators `@router.post("/approve")` and `@router.post("/handover/approve")` (and acknowledge counterparts). Both return `200 OK`. |
| **BUG-003** | **P0** | Backend Schema | Approval or acknowledgement with empty `{}` or `{"notes": "..."}` failed with `422 Unprocessable Entity`. | `HandoverApproveRequest.project_id` and `AcknowledgeRequest.handover_version_id` were non-defaulted required fields. | `d99a007` | Set default `project_id="campusconnect"` and made `handover_version_id` optional (falling back to latest approved version), supporting both `note` and `notes`. |
| **BUG-004** | **P1** | Frontend A11y | `EvidenceDrawer` could only be closed by clicking the close button; pressing `Escape` did nothing. | Missing `keydown` keyboard event listener on the window. | `049dd70` | Added `useEffect` registering `e.key === "Escape"` listener that dispatches `onClose()`. |
| **BUG-005** | **P1** | Deployment | Missing `Dockerfile` and `.dockerignore` for single-service container deployment on Render/Railway. | Repository only provided native Python build configuration in `render.yaml`. | `a6ecef1` | Created multi-stage `Dockerfile` (Node 20 Alpine builder + Python 3.11 slim runtime) serving static SPA from `/app/frontend/dist` with health check. |
| **BUG-006** | **P1** | Security | Wildcard `*` in `CORS_ORIGINS` was not rejected in production environments. | `settings.cors_origins_list` lacked environment check. | `41320db` | Added safeguard stripping wildcard `*` whenever `ENVIRONMENT == "production"`. |
| **BUG-007** | **P2** | Documentation | `README.md` badges and architectural diagrams referenced Anthropic Claude instead of Google Gemini. | Residual copy from initial specification before standardizing on Gemini 2.5 Flash via `google-genai`. | `c0ecef1` | Updated badges, architecture diagram, and text to reflect Google Gemini API engine and offline deterministic cache. |

---

## 2. Known Limitations

1. **Single-Node In-Memory Concurrency**: SQLite with WAL mode supports unlimited concurrent readers and serialized writers. For high-volume enterprise deployments with hundreds of simultaneous approvers, an external PostgreSQL database is recommended.
2. **Clearance Simulation**: The platform uses `X-User-Id` header simulation for frictionless demo switching between Riya (Leaver), Maya (Lead), and Arjun (Successor). In production enterprise deployments, this header must be injected exclusively by an authenticating reverse proxy or API gateway.
3. **Synthesis Chunk Capping**: The extraction service caps evidence ingestion at 5 parallel chunks per execution to prevent hitting Gemini API rate limits on free-tier keys. Full offline caching guarantees 100% demo availability.

---

## 3. Needs Human Decision

1. **OAuth2 / SSO Provider Selection**: Confirm whether enterprise SSO (Okta, Google Workspace, GitHub OAuth) should replace the `X-User-Id` header simulation in Post-Hackathon v2.0.
2. **PostgreSQL Transition**: Decide if the production Render deployment should use a hosted Postgres instance or persist with SQLite WAL mode on a persistent disk volume.
