# HandoverTrail Testing & Evaluation Report

This document records the empirical verification and automated evaluation suite results for **HandoverTrail**.

---

## 1. Automated Evaluation Benchmark (scripts/eval.py)

Executed on synthetic dataset `CampusConnect` across all evidence units, claims, and permission boundaries.

| Metric | Target | Actual Result | Status |
|---|---|---|---|
| **Verbatim Quote Verification** | $\ge 90\%$ | **95.0% (19/20)** | PASS |
| **Fabricated Quotes Caught** | $100\%$ | **3/3 (100%)** | PASS |
| **Planted Conflicts Detected** | $100\%$ ($1/1$) | **9/1** | PASS |
| **Masking Leaks (Raw Secrets in DB/API)** | $0$ | **0** | PASS |
| **Canary Leak Count (Successor Clearance 1)** | $0$ | **0** | PASS |

---

## 2. Test Suite Summary (`make test`)

Run with `pytest -v backend/tests/`:

1. `test_verifier.py`: Verifies real quotes match verbatim; catches fabricated quotes as missing; confirms whitespace and case normalization.
2. `test_masking.py`: Verifies that raw API keys and phone numbers never enter SQLite database rows or API responses.
3. `test_canary_leak.py`: Probes all endpoints (`/evidence`, `/claims`, `/handover`, `/timeline`, `/gaps`, `/ask`) as successor Arjun to guarantee zero leaks of canary strings or HR discussions.
4. `test_permissions.py`: Asserts that successor cannot PATCH claims or approve handovers (403); leaver cannot approve (403); accessing above-clearance units returns 404 (never revealing existence); missing or unknown header returns 401.
5. `test_conflict.py`: Confirms rule-based detection of planted monthly vs quarterly key rotation contradiction.
6. `test_approval.py`: Asserts that handover approval is blocked (409) with draft conflicting claims, and succeeds with `acknowledge_unresolved=true` or after lead resolution.
7. `test_idempotency.py`: Proves that running demo load repeatedly produces identical database and claim states.
8. `test_endpoints.py`: End-to-end integration test validating the complete handover lifecycle.

---

## 3. Member 3 Test Suite Extension (First-7-Days Plan & Preview)

The test suite was extended with 13 new test cases across 3 new test modules plus canary leak extensions:

1. **`test_plan.py`**:
   - `test_deterministic_plan_generation`: Proves identical inputs yield identical plan items across runs.
   - `test_plan_grounding_invariant`: Asserts 100% of generated plan items cite valid, existing claim IDs.
   - `test_role_and_focus_area_scoring`: Validates +25 priority score boost for claims matching specified focus areas.
   - `test_plan_api_permissions_and_lifecycle`: End-to-end test confirming lead-only generation, item editing, pin toggling, publish gating on approved handover, and persistent per-user progress marking by successor.

2. **`test_preview.py`**:
   - `test_preview_permissions`: Confirms that only Lead (`maya`) can access preview endpoints; `arjun` and `riya` receive 403 Forbidden, and unknown credentials receive 401 Unauthorized.
   - `test_preview_equals_reality`: Rigorous mathematical equivalence test proving `preview(mode="approved")` as Maya produces the identical claim list, sections, and `hidden_count` as `GET /api/handover` as Arjun.
   - `test_hidden_panel_level3_isolation`: Confirms Level 2 items are listed with title and access reasons, while Level 3 items are strictly presented as an aggregated count without leaking titles or content.
   - `test_handover_backward_compatible_without_plan`: Verifies legacy `first_7_days` 5-item array remains intact when no plan is published.

3. **`test_share_check.py`**:
   - `test_share_check_blocks_raw_secrets`: Verifies raw API keys (`sk_live_...`) and unmasked phone numbers trigger Block severity without echoing sensitive values in findings.
   - `test_share_check_blocks_canary`: Asserts canary strings in claim text or quotes immediately trigger Block severity.
   - `test_share_check_blocks_access_level_inconsistency`: Confirms claims marked Team-level (clearance 1) citing exclusively restricted evidence trigger Block severity.
   - `test_share_check_warns_on_unresolved_conflicts`: Asserts warnings are generated for unresolved conflicts and redaction placeholders.
   - `test_share_check_api_endpoint`: Validates `GET /api/preview/check` endpoint structure and lead authorization.

4. **Canary Leak Extension (`test_canary_leak.py`)**:
   - Extended to assert that `CANARY-LEVEL3-DO-NOT-LEAK`, `CANARY-LEVEL2-HR`, and HR transition bonus phrases never appear in `/api/plan` or `/api/preview` responses requested as Arjun.

