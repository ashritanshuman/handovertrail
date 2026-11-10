# Round 3 Roadmap & Planned Extensions

This document defines the scope boundary between the current Round 2 MVP implementation and the planned Round 3 features.

---

## 1. Round 2 Scope Delivered (Current MVP)
- **Deterministic Verification Engine**: Verifies exact verbatim quotes against ingested source artifacts; flags missing evidence and inferences.
- **Rule-Based Conflict Detection**: Identifies entity/attribute contradictions (e.g., monthly vs quarterly key rotation).
- **Clearance & Privacy Boundaries**: Strict 3-level clearance model (Team, Lead, Confidential) with pre-storage PII/secret masking and 404 access gates.
- **Baseline Versioning & Approval**: Freezes immutable handover snapshot (`1.0.0`) signed off by Lead Maya, with blocker checks.
- **Successor Delivery**: Role-appropriate handover view with sections, hidden items counter, and receipt acknowledgement.

---

## 2. Round 3 Scope (Marked as Planned)

### 1. Full Interactive Conflict Resolution Workflow with Exit-Interview Q&A
- **Status**: *Planned (Round 3)*
- **Description**: An interactive multi-turn interview UI where the platform guides departing engineer Riya through each identified contradiction and open question, collecting audio/text responses that automatically generate new attributed evidence (`source_type="exit_interview"`) and offer 1-click conflict reconciliation for lead Maya.

### 2. Deep Version History with Visual Diff, Acknowledgement Tracking & Audit Log UI
- **Status**: *Planned (Round 3)*
- **Description**:
  - Semantic side-by-side claim diffing across handover versions (`1.0.0` vs `1.1.0` vs `2.0.0`).
  - Dedicated front-end audit log viewer for compliance officers to inspect mutation histories with before/after state snapshots.
  - Multi-stakeholder receipt acknowledgements with cryptographic signatures.

### 3. Dynamic First-7-Days Plan Generator with Live Successor Preview Mode
- **Status**: *Planned (Round 3)*
- **Description**:
  - Live interactive onboarding roadmap with day-by-day task checkboxes, estimated hours, and direct links to code repos.
  - "Preview As Successor" split-screen simulation for the team lead during the approval review.
