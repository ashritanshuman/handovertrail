# CampusConnect Synthetic Handover Dataset Specification

> **Project**: CampusConnect (Campus student event discovery and ticketing platform)  
> **Departing Engineer (Leaver)**: Riya Sharma (`riya`, Staff Full-Stack Engineer, Clearance Level 2)  
> **Engineering Director (Lead / Approver)**: Maya Patel (`maya`, Engineering Director, Clearance Level 2)  
> **Incoming Engineer (Successor)**: Arjun Rao (`arjun`, Senior Software Engineer, Clearance Level 1)

---

## 1. Overview of Evidence Sources

The dataset contains ~52 distinct evidence units distributed across 4 authentic repository/tool exports:

| File | Source Type | Format | Unit Count | Purpose |
|---|---|---|---|---|
| `github_export.json` | `github` | JSON | 16 units | Commits, pull requests, issues, and code reviews. |
| `tasks.csv` | `jira` | CSV | 14 units | Sprint task board, backlog items, and technical debt spikes. |
| `meeting_notes.md` | `meeting_notes` | Markdown | 10 units | Architectural design reviews, sprint retros, and lead transitions. |
| `slack_export.json` | `slack` | JSON | 12 units | Slack threads across `#engineering`, `#leads-private`, and `#incident-response`. |
| **Total** | | | **52 units** | Comprehensive multi-channel coverage. |

---

## 2. Deliberately Planted Verification Challenges

| Seed Challenge | Source References | Description | Expected Engine Behavior |
|---|---|---|---|
| **(a) Direct Conflict: API Key Rotation** | `Issue #42` (GitHub) vs `Architecture Review 2026-09-15` (Notes) | Issue #42 specifies **monthly (30-day)** API key rotation. Architecture Notes document consensus on **quarterly (90-day)** rotation to avoid webhook disruption. | Flagged as `status: conflicting`. Quarantined from auto-verification until lead resolves. |
| **(b) Abandoned PR with Unresolved Review** | `PR #88` (GitHub) | Riya authored WebSocket reservation count pub-sub. Maya left an unresolved comment about socket leaks on sudden client disconnects. | Synthesizes an open knowledge gap in `questions`. Prevents handover approval until addressed. |
| **(c) Single-Owner Knowledge Risk** | `PR #72`, `TASK-104`, `Commit 4a8f9c2` | Payment reconciliation ledger and Stripe webhook idempotency module was authored, reviewed, and deployed solely by Riya with 0 co-authors. | Extracted as a high-severity `risk` claim (Single Point of Failure). |
| **(d) Level-2 Lead-Only HR Thread** | `#leads-private` (Slack) | Confidential discussion between Maya and Riya regarding resignation notice, equity acceleration, and leaver performance signoff. | Filtered on server: hidden from Arjun (Clearance 1), accessible only to Maya & Riya. |
| **(e) Level-3 Secrets & PII to Mask** | `#incident-response` (Slack) | Real-looking mock secret `sk_live_campusevents_99834289472398472398472398` and emergency SMS phone `+91-98765-43210`. | Masking service deterministically redacts tokens into `[REDACTED_API_KEY]` and `[REDACTED_PHONE]`. |
| **(f) Buried Architectural Decision** | `#engineering` (Slack) | Riya's detailed breakdown explaining why SQLite with WAL mode was chosen over PostgreSQL for local ticketing throughput. | Extracted as a `decision` claim with exact quote match. |
| **(g) Vague Unsupported Claim** | `TASK-118` (CSV) | "The mobile push notifications are fully certified for iOS 18 APNs with zero payload truncation issues." (Zero tests or logs attached). | Verification engine marks as `inferred` or flags for leaver substantiation. |

