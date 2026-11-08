# HandoverTrail Test Strategy & Verification Guide

This document details the test harness for HandoverTrail, covering unit, permission, deterministic verification, and end-to-end API suites.

---

## 1. Running Tests

### Backend Tests (pytest)
```bash
# Using Makefile
make test

# Or directly in backend virtual environment
cd backend
source venv/bin/activate
pytest -v tests/
```

### Frontend Checks
```bash
cd frontend
npm run typecheck # or npx tsc --noEmit
npm run build
```

---

## 2. Test Suites

### Suite 1: System Health & Base Routing (`test_health.py`)
- Verifies `GET /health` returns status `200` with status `"ok"` and environment info.
- Verifies CORS headers are properly dispatched for allowed origins.

### Suite 2: Permission & Clearance Enforcement (`test_permissions.py`)
- **Clearance Level 1 (Successor `arjun`)**:
  - Validates that `GET /api/evidence` returns ONLY Level 1 evidence units.
  - Confirms that Level 2 (lead-only HR thread) and Level 3 items are omitted.
  - Verifies that attempting to access a Level 2 claim directly returns `403 Forbidden` or `404 Not Found`.
  - Verifies that `PATCH /api/claims/{id}` and `POST /api/approve` fail with `403 Forbidden` when invoked by `arjun`.
- **Clearance Level 2 (Lead `maya` & Leaver `riya`)**:
  - Validates access to both Level 1 and Level 2 evidence and claims.
  - Verifies `maya` can execute claim updates, approvals, and gap management.

### Suite 3: Deterministic Verifier & Quote Matching (`test_verify.py`)
- Tests exact substring containment against raw evidence unit texts.
- Tests whitespace and punctuation normalization.
- Verifies that claims with non-matching quotes are categorized as `inferred`.
- Verifies that conflicting evidence units are flagged as `conflicting`.

### Suite 4: Redaction & Secret Masking (`test_masking.py`)
- Asserts that raw API keys (e.g., `sk_live_campusevents_...`) are redacted to `[REDACTED_API_KEY]`.
- Asserts that raw phone numbers (e.g., `+91-98765-43210`) are redacted to `[REDACTED_PHONE]`.

### Suite 5: End-to-End Handover Lifecycle (`test_endpoints.py`)
- **Step 1**: Load synthetic demo dataset via `POST /api/demo/load`.
- **Step 2**: Extract claims via `POST /api/extract`.
- **Step 3**: Lead reviews and updates conflicting claim via `PATCH /api/claims/{id}`.
- **Step 4**: Leaver answers unresolved question via `POST /api/gaps/{id}/answer`.
- **Step 5**: Lead signs off via `POST /api/approve`.
- **Step 6**: Successor views approved handover via `GET /api/handover` and acknowledges via `POST /api/acknowledge`.
- **Step 7**: Verify audit log records all actions via `GET /api/audit`.

---

## 3. Synthetic Seed Verification Checklist

| Seeded Scenario | Expected Behavior | Automated Test Verification |
|---|---|---|
| **Conflict (API Key Rotation)** | Marked `status: conflicting` with both sources referenced | `test_planted_conflict_detection` |
| **Abandoned PR #88** | Synthesizes open question in `questions` table | `test_abandoned_pr_gap_generation` |
| **Single-Owner Area (Payment module)** | Highlights single owner risk for Riya | `test_single_owner_risk_claim` |
| **HR Thread (Level 2)** | Hidden from Arjun (Clearance 1), visible to Maya & Riya | `test_hr_thread_clearance_filtering` |
| **Fake API Key & Phone (Level 3)** | Masked before returning to any standard API viewer | `test_secret_masking_applied` |
| **Buried Chat Decision (SQLite WAL)** | Extracted with exact quote citation | `test_sqlite_wal_decision_extraction` |
| **Vague Unsupported Statement** | Marked `inferred` or rejected due to lack of quote | `test_vague_claim_not_verified` |
