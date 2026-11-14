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

---

## 4. Member 2 Test Suite Extension (Version History, Acknowledgement Tracking & Audit Viewer)

The test suite was extended with 10 new rigorous test cases across 2 new test modules plus canary leak and formula injection protection tests:

1. **`test_versions.py`**:
   - `test_list_versions_permissions`: Verifies Maya (Lead) receives full version summaries and status distributions; Riya (Leaver) receives metadata-only view with counts masked; Arjun (Successor) receives 403 Forbidden; missing/unknown credentials receive 401 Unauthorized.
   - `test_version_diff_added_removed_changed`: Seeds V1.0.0 and V1.1.0 with edited claim statements, reassigned owners, and rejected claims; confirms field-level diff precision, old vs new values, audit author attribution (`changed_by`), and rationale capture (`audit.after_json.note`).
   - `test_acknowledgement_tracking_status`: Tests full multi-version lifecycle: initial `pending` state -> `acknowledged` after successor sign-off on V1.0.0 -> automatically transition to `outdated` when Lead approves V1.1.0 -> refusal of attempts to acknowledge superseded versions (400 Bad Request) -> `acknowledged` after re-acknowledging V1.1.0.
   - `test_seed_history_demo_helper`: Validates the `POST /api/demo/seed-history` helper, confirming immediate creation of versions 1.0.0 and 1.1.0 with outdated state for Arjun.
   - `test_canary_leak_protection_versions`: Tests that `CANARY-LEVEL3-DO-NOT-LEAK` never appears in version lists, frozen snapshots, diffs, or acknowledgement tracking for any persona.

2. **`test_audit_viewer.py`**:
   - `test_audit_log_backward_compatibility`: Asserts that `GET /api/audit` without query parameters continues to return `List[AuditLogDetailRead]`, perfectly preserving backward compatibility with legacy test suites and consumers.
   - `test_audit_log_filtering_and_search`: Verifies multi-attribute filtering by `actor`, `action`, `entity`, and free-text keyword search `q`.
   - `test_audit_log_pagination`: Tests server-side cursor pagination with bounded page limits (`limit=2`), verifying total count, `has_more` boolean, and cursor continuation across pages.
   - `test_audit_export_csv_and_formula_protection`: Validates `GET /api/audit/export?format=csv` streaming output, RFC 4180 headers, and formula-injection defenses (cells starting with `=`, `+`, `-`, or `@` are safely prefixed with `'`).
   - `test_canary_leak_protection_audit`: Proves level-3 canary strings are masked as `[REDACTED]` in audit before/after JSON structures and CSV exports; verifies 403 Forbidden gates for non-lead callers.

---

## 5. Member 1 Test Suite Extension (Conflict Resolution & Exit Interview)

The test suite was extended with 12 new test cases across 3 test modules plus canary leak extensions:

1. **`test_conflicts.py`**:
   - `test_detect_all_four_planted_conflicts`: Confirms deterministic multi-attribute detection across all 4 planted conflicts (rotation period, module ownership, cutover date, status/supersession).
   - `test_list_and_get_conflicts_as_lead`: Confirms Lead Maya retrieves all conflict groups with topics, suggestions, and cited evidence quotes.
   - `test_conflict_filtering_by_status_and_type`: Validates filtering by status (`open`, `resolved`, `dismissed`, `unresolved`) and type (`contradiction`, `supersession`).
   - `test_conflicts_access_control`: Verifies strict RBAC where Arjun is blocked (403), Riya is blocked (403), and missing auth returns 401.

2. **`test_interview.py`**:
   - `test_interview_session_retrieval`: Asserts exit-interview session returns prioritized questions (conflicts first, gaps second) with side-by-side quotes.
   - `test_answer_interview_question_with_masking`: Confirms answers are sanitized for PII/secrets before storage and saved as attributed `EvidenceUnit` (access level 2).
   - `test_skip_interview_question`: Validates skip flow with reason and reload persistence.

3. **`test_resolution.py`**:
   - `test_resolve_conflict_chose_claim`: Validates resolution via choosing an existing claim (`review_state="confirmed"`, competitors `rejected`).
   - `test_resolve_conflict_corrected`: Validates synthesized corrected claim creation (`origin="human"`) with deterministic re-verification.
   - `test_dismiss_conflict_group`: Asserts false-positive dismissal with mandatory rationale.
   - `test_leave_conflict_unresolved`: Asserts explicit deferral with mandatory rationale.
   - `test_approval_gating_with_open_conflicts`: Proves open or unresolved conflicts block approval with HTTP 409 Conflict.



