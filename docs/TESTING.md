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
