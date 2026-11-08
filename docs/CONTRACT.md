# HandoverTrail Contract & API Specification

> **Single Source of Truth** for Frontend, Backend, AI Extraction Services, and Verification Engine.

---

## 1. Core Trust & Security Model

HandoverTrail enforces an **evidence-first, permission-aware** trust model:
1. **Evidence-First**: No claim is presented as "verified" without an exact verbatim quote matching a raw ingested evidence unit. If an inference is made without an exact quote, its status is marked `inferred`. If evidence directly contradicts, its status is `conflicting`. If a known critical domain lacks evidence, it is `missing`.
2. **Permission-Aware**: Permissions are strictly enforced **on the server** before data leaves the backend or enters an LLM context. Viewers can **never** see or infer content above their clearance level.
3. **Approval Gating**: Nothing is published or shared with successors before an authorized lead reviews, resolves conflicts, and signs off on an approved handover snapshot.

---

## 2. Access Levels & Clearances

| Access Level | Name | Description | Example Entities |
|---|---|---|---|
| **1** | `Team` | Accessible to all project team members, including incoming successors. | Public tickets, codebase documentation, standard engineering meeting notes, architecture decisions. |
| **2** | `Lead-Only` | Accessible only to project leads, departing leads, and managers. | Performance reviews, team capacity planning, sensitive transition roadmap, escalation discussions. |
| **3** | `Confidential` | Redacted/masked from standard views. Sensitive credentials, PII, keys, salary. | Production secrets, personal phone numbers, compensation data. Masked deterministically before exposure. |

### Rule on Response Filtering
Every response returned by the backend API is **filtered by the viewer's clearance level** on the server:
- If an entity's `access_level > viewer.clearance`, the entity is excluded from list responses.
- Direct lookups for an entity above the viewer's clearance return `403 Forbidden` or `404 Not Found` (to prevent identifier probing).
- For Level 3 confidential entities or tokens embedded within allowed text, the masking service automatically replaces the sensitive token with a redacted placeholder (e.g., `[REDACTED_API_KEY]`, `[REDACTED_PHONE]`).

---

## 3. Seeded Users

Authentication is simulated via the `X-User-Id` HTTP request header for hackathon testing and demoing without login friction.

| User ID (`X-User-Id`) | Full Name | Role | Clearance Level | Permissions / Responsibilities |
|---|---|---|---|---|
| `riya` | Riya Sharma | `leaver` | **2 (Lead-Only)** | Departing Staff Engineer. Authors claims, answers gaps, can view Level 1 and Level 2 evidence. |
| `maya` | Maya Patel | `lead` | **2 (Lead-Only)** | Engineering Director / Approver. Can review, edit, reject, confirm claims, and approve final handovers. |
| `arjun` | Arjun Rao | `successor` | **1 (Team)** | Incoming Software Engineer. Reads approved handovers, acknowledges receipt, can query Q&A within Level 1 clearance. |

*Default Fallback*: If `X-User-Id` is missing, the backend defaults to `arjun` (least privilege, Level 1).

---

## 4. Enumerations

### Claim Type (`type`)
- `decision`: Architectural or operational decision taken by the leaver or team.
- `task`: Action item, ongoing obligation, or handoff task requiring execution.
- `risk`: Technical debt, single point of failure (SPOF), operational fragility, or security risk.
- `dependency`: External vendor, internal service, or cross-team blocker.
- `open_question`: Unresolved problem, pending design question, or ambiguous requirement.
- `contact`: Key person, vendor contact, or subject-matter expert for an area.

### Claim Status (`status`)
- `verified`: Exact verbatim quote match found in an ingested evidence unit.
- `inferred`: Plausible claim synthesized by LLM or human, but lacking an exact source quote match.
- `conflicting`: Discrepant statements exist across two or more evidence units (e.g. rotation period differences).
- `missing`: Identified knowledge gap where expected documentation does not exist.

### Review State (`review_state`)
- `draft`: Freshly extracted by AI or ingested from cache; awaits human review.
- `confirmed`: Accepted as-is by an authorized lead (`maya`).
- `rejected`: Discarded by lead as irrelevant, incorrect, or out-of-scope.
- `edited`: Text, type, owner, or quote updated by human review.

### Handover State (`handover_state`)
- `draft`: Extraction and claim consolidation in progress.
- `in_review`: Claims curated and ready for approver sign-off.
- `approved`: Snapshot frozen and cryptographically versioned; unlocked for successor viewing.

### Claim Origin (`origin`)
- `llm`: Discovered by Claude structured extraction.
- `cache`: Loaded from pre-extracted synthetic seed cache.
- `human`: Added or modified manually by the leaver or lead.

---

## 5. Database Schema & Tables

```
users (id, name, role, clearance, email)
projects (id, name, description, repo_url, created_at)
evidence_units (id, project_id, source_type, source_ref, location, author, timestamp, text, access_level)
claims (id, project_id, type, text, owner, status, evidence_ids, quote, access_level, review_state, version, origin)
questions (id, claim_id, text, answer, state, asked_by, answered_by, created_at, answered_at)
handover_versions (id, project_id, version, snapshot_json, approved_by, approved_at, notes)
acknowledgements (id, handover_version_id, user_id, acknowledged_at, note)
audit_log (id, user_id, action, target_type, target_id, timestamp, details)
```

### Table Definitions

#### 1. `users`
- `id` (VARCHAR(50), PRIMARY KEY): e.g. `'riya'`, `'maya'`, `'arjun'`
- `name` (VARCHAR(100)): User display name
- `role` (VARCHAR(50)): `'leaver'`, `'lead'`, `'successor'`
- `clearance` (INTEGER): `1`, `2`, or `3`
- `email` (VARCHAR(150)): User email address

#### 2. `projects`
- `id` (VARCHAR(50), PRIMARY KEY): e.g. `'campusconnect'`
- `name` (VARCHAR(100)): Project name
- `description` (TEXT): High level summary
- `repo_url` (VARCHAR(255)): Associated repository link
- `created_at` (DATETIME): Project initialization timestamp

#### 3. `evidence_units`
- `id` (VARCHAR(50), PRIMARY KEY): e.g. `'ev-github-001'`
- `project_id` (VARCHAR(50), FK): Reference to `projects.id`
- `source_type` (VARCHAR(50)): `'github'`, `'jira'`, `'meeting_notes'`, `'slack'`
- `source_ref` (VARCHAR(100)): e.g. `'PR #88'`, `'TASK-104'`, `'Meeting 2026-09-15'`, `'#incident-response'`
- `location` (VARCHAR(255)): URL, file path, or deep-link
- `author` (VARCHAR(100)): Author name or handle (e.g. `'Riya Sharma'`)
- `timestamp` (DATETIME): Original creation time of the artifact
- `text` (TEXT): Raw content or comment text
- `access_level` (INTEGER): `1` (Team), `2` (Lead-only), or `3` (Confidential)

#### 4. `claims`
- `id` (VARCHAR(50), PRIMARY KEY): e.g. `'clm-001'`
- `project_id` (VARCHAR(50), FK): Reference to `projects.id`
- `type` (VARCHAR(50)): `'decision' | 'task' | 'risk' | 'dependency' | 'open_question' | 'contact'`
- `text` (TEXT): Normalized claim statement
- `owner` (VARCHAR(100)): Individual or team responsible
- `status` (VARCHAR(50)): `'verified' | 'inferred' | 'conflicting' | 'missing'`
- `evidence_ids` (JSON ARRAY): `["ev-github-001", "ev-slack-009"]`
- `quote` (TEXT): Verbatim snippet extracted directly from evidence text
- `access_level` (INTEGER): `1`, `2`, or `3`
- `review_state` (VARCHAR(50)): `'draft' | 'confirmed' | 'rejected' | 'edited'`
- `version` (INTEGER): Increment on edits (default: 1)
- `origin` (VARCHAR(20)): `'llm' | 'cache' | 'human'`

#### 5. `questions` (Gaps & Knowledge Questions)
- `id` (VARCHAR(50), PRIMARY KEY): e.g. `'gap-001'`
- `claim_id` (VARCHAR(50), FK, Nullable): Associated claim id
- `text` (TEXT): The knowledge gap or clarifying question
- `answer` (TEXT, Nullable): Leaver's answer or resolution
- `state` (VARCHAR(50)): `'open' | 'answered' | 'dismissed'`
- `asked_by` (VARCHAR(50)): User who raised the question (or `'system'`)
- `answered_by` (VARCHAR(50), Nullable): User who provided the answer
- `created_at` (DATETIME): Timestamp
- `answered_at` (DATETIME, Nullable): Timestamp

#### 6. `handover_versions`
- `id` (VARCHAR(50), PRIMARY KEY): e.g. `'hv-v1.0'`
- `project_id` (VARCHAR(50), FK): Reference to `projects.id`
- `version` (VARCHAR(20)): Semver string e.g. `'1.0.0'`
- `snapshot_json` (JSON / TEXT): Complete immutable snapshot of approved claims, metrics, and evidence references
- `approved_by` (VARCHAR(50), FK): Reference to approving lead (`'maya'`)
- `approved_at` (DATETIME): Approval timestamp
- `notes` (TEXT): Sign-off note or release commentary

#### 7. `acknowledgements`
- `id` (VARCHAR(50), PRIMARY KEY): e.g. `'ack-001'`
- `handover_version_id` (VARCHAR(50), FK): Reference to `handover_versions.id`
- `user_id` (VARCHAR(50), FK): Successor user id (`'arjun'`)
- `acknowledged_at` (DATETIME): Timestamp of acknowledgement
- `note` (TEXT): Optional feedback or onboarding note

#### 8. `audit_log`
- `id` (VARCHAR(50), PRIMARY KEY): e.g. `'aud-001'`
- `user_id` (VARCHAR(50)): Actor who triggered the action
- `action` (VARCHAR(100)): e.g. `'LOAD_DEMO'`, `'EXTRACT_CLAIMS'`, `'REVIEW_CLAIM'`, `'APPROVE_HANDOVER'`, `'ACKNOWLEDGE'`
- `target_type` (VARCHAR(50)): `'claim'`, `'handover'`, `'gap'`, `'project'`
- `target_id` (VARCHAR(100)): Target record id
- `timestamp` (DATETIME): Event timestamp
- `details` (JSON / TEXT): Supplemental context

---

## 6. API Endpoints Specification

All endpoints prefix: `/api`

### 1. `POST /api/demo/load`
Loads or resets the synthetic demo dataset for "CampusConnect".

- **Headers**: `X-User-Id: maya` (or `riya`)
- **Request Body**:
```json
{
  "force_reset": true,
  "project_id": "campusconnect"
}
```
- **Response `200 OK`**:
```json
{
  "status": "success",
  "project_id": "campusconnect",
  "evidence_count": 52,
  "claims_loaded": 18,
  "gaps_loaded": 4,
  "message": "CampusConnect synthetic dataset loaded successfully with planted conflicts, secrets, and orphan tasks."
}
```

---

### 2. `GET /api/project`
Fetches current project metadata and progress status.

- **Headers**: `X-User-Id: arjun`
- **Response `200 OK`**:
```json
{
  "id": "campusconnect",
  "name": "CampusConnect",
  "description": "Campus student event discovery and ticketing platform.",
  "repo_url": "https://github.com/campusconnect/core",
  "leaver": {
    "id": "riya",
    "name": "Riya Sharma",
    "role": "leaver"
  },
  "lead": {
    "id": "maya",
    "name": "Maya Patel",
    "role": "lead"
  },
  "handover_state": "in_review",
  "created_at": "2026-09-01T09:00:00Z"
}
```

---

### 3. `GET /api/evidence`
Retrieves raw ingested evidence units filtered by caller's clearance.

- **Headers**: `X-User-Id: arjun` (Clearance 1)
- **Query Params**: `source_type=github&limit=50`
- **Response `200 OK`**:
```json
[
  {
    "id": "ev-github-001",
    "project_id": "campusconnect",
    "source_type": "github",
    "source_ref": "Issue #42",
    "location": "https://github.com/campusconnect/core/issues/42",
    "author": "Riya Sharma",
    "timestamp": "2026-09-10T14:30:00Z",
    "text": "The payment provider API key must be rotated monthly every 30 days per PCI requirement.",
    "access_level": 1
  }
]
```
*(Notice: Level 2 and Level 3 items are automatically excluded for `arjun`)*

---

### 4. `POST /api/extract`
Triggers AI claim extraction using Claude or cached synthetic seed pipeline. Deterministically verifies claims against exact quotes.

- **Headers**: `X-User-Id: riya`
- **Request Body**:
```json
{
  "project_id": "campusconnect",
  "use_cache": true,
  "max_units": 60
}
```
- **Response `200 OK`**:
```json
{
  "status": "completed",
  "extracted_count": 18,
  "verified_count": 12,
  "conflicting_count": 2,
  "inferred_count": 3,
  "missing_count": 1,
  "duration_ms": 1420
}
```

---

### 5. `GET /api/claims`
Lists extracted claims filtered by type, status, and viewer's clearance.

- **Headers**: `X-User-Id: maya` (Clearance 2)
- **Query Params**: `type=risk&status=conflicting`
- **Response `200 OK`**:
```json
[
  {
    "id": "clm-004",
    "project_id": "campusconnect",
    "type": "risk",
    "text": "Inconsistent API key rotation policy between documentation and sprint retro notes.",
    "owner": "Riya Sharma",
    "status": "conflicting",
    "evidence_ids": ["ev-github-001", "ev-notes-003"],
    "quote": "rotate external API keys quarterly (90 days)",
    "access_level": 1,
    "review_state": "draft",
    "version": 1,
    "origin": "llm",
    "conflict_details": {
      "statement_a": "Issue #42: rotate monthly every 30 days",
      "statement_b": "Meeting Notes 2026-09-15: rotate external API keys quarterly (90 days)"
    }
  }
]
```

---

### 6. `GET /api/claims/{id}`
Returns details for a single claim with its supporting evidence quotes.

- **Headers**: `X-User-Id: maya`
- **Response `200 OK`**:
```json
{
  "id": "clm-004",
  "project_id": "campusconnect",
  "type": "risk",
  "text": "Inconsistent API key rotation policy between documentation and sprint retro notes.",
  "owner": "Riya Sharma",
  "status": "conflicting",
  "evidence_ids": ["ev-github-001", "ev-notes-003"],
  "quote": "rotate external API keys quarterly (90 days)",
  "access_level": 1,
  "review_state": "draft",
  "version": 1,
  "origin": "llm",
  "supporting_evidence": [
    {
      "id": "ev-github-001",
      "source_ref": "Issue #42",
      "text": "The payment provider API key must be rotated monthly every 30 days per PCI requirement.",
      "author": "Riya Sharma"
    },
    {
      "id": "ev-notes-003",
      "source_ref": "Architecture Meeting 2026-09-15",
      "text": "We agreed to rotate external API keys quarterly (90 days) to avoid breaking webhook integrations.",
      "author": "Maya Patel"
    }
  ]
}
```

---

### 7. `PATCH /api/claims/{id}`
Reviews, updates, or confirms a claim (**Lead / Approver only**).

- **Headers**: `X-User-Id: maya`
- **Request Body**:
```json
{
  "review_state": "confirmed",
  "text": "External payment keys rotate quarterly (90 days) with automated slack reminder.",
  "quote": "We agreed to rotate external API keys quarterly (90 days)",
  "owner": "Arjun Rao"
}
```
- **Response `200 OK`**:
```json
{
  "id": "clm-004",
  "review_state": "confirmed",
  "status": "verified",
  "version": 2,
  "updated_at": "2026-11-08T15:30:00Z",
  "message": "Claim successfully confirmed by lead maya."
}
```
*(If `X-User-Id` is `arjun`, returns `403 Forbidden`)*

---

### 8. `GET /api/gaps`
Lists identified knowledge gaps and clarifying questions.

- **Headers**: `X-User-Id: riya`
- **Query Params**: `state=open`
- **Response `200 OK`**:
```json
[
  {
    "id": "gap-001",
    "claim_id": "clm-009",
    "text": "PR #88 (WebSocket ticket reservations) was abandoned after Maya's heartbeat ping-pong comment. Is this branch safe to deploy or does it leak sockets?",
    "answer": null,
    "state": "open",
    "asked_by": "system",
    "created_at": "2026-10-01T10:00:00Z"
  }
]
```

---

### 9. `POST /api/gaps/{id}/answer`
Leaver or lead answers an open knowledge gap.

- **Headers**: `X-User-Id: riya`
- **Request Body**:
```json
{
  "answer": "Do NOT deploy PR #88 as-is. It leaks sockets if clients disconnect without TCP FIN. We implemented HTTP SSE polling in PR #94 instead as a fallback."
}
```
- **Response `200 OK`**:
```json
{
  "id": "gap-001",
  "state": "answered",
  "answered_by": "riya",
  "answer": "Do NOT deploy PR #88 as-is. It leaks sockets if clients disconnect without TCP FIN. We implemented HTTP SSE polling in PR #94 instead as a fallback.",
  "answered_at": "2026-11-08T15:45:00Z"
}
```

---

### 10. `GET /api/timeline`
Chronological view of key decisions, PRs, and incidents leading to handover.

- **Headers**: `X-User-Id: arjun`
- **Response `200 OK`**:
```json
[
  {
    "date": "2026-08-15",
    "title": "Database Engine Decision",
    "category": "decision",
    "summary": "Chose SQLite with WAL mode for local edge cache before scaling to managed Postgres.",
    "source_ref": "#engineering slack",
    "access_level": 1
  },
  {
    "date": "2026-09-10",
    "title": "Stripe Webhook Idempotency Ledger Authored",
    "category": "task",
    "summary": "Sole author Riya implemented payment reconciliation service.",
    "source_ref": "PR #72",
    "access_level": 1
  }
]
```

---

### 11. `GET /api/stats`
Consolidated readiness metrics and counts by status/type.

- **Headers**: `X-User-Id: maya`
- **Response `200 OK`**:
```json
{
  "total_claims": 18,
  "by_status": {
    "verified": 13,
    "inferred": 2,
    "conflicting": 1,
    "missing": 2
  },
  "by_type": {
    "decision": 5,
    "task": 4,
    "risk": 3,
    "dependency": 2,
    "open_question": 2,
    "contact": 2
  },
  "by_review_state": {
    "draft": 4,
    "confirmed": 12,
    "rejected": 1,
    "edited": 1
  },
  "open_gaps_count": 1,
  "readiness_percentage": 82.5,
  "can_approve": true
}
```

---

### 12. `POST /api/approve`
Approves and freezes the handover snapshot (**Lead only**).

- **Headers**: `X-User-Id: maya`
- **Request Body**:
```json
{
  "project_id": "campusconnect",
  "notes": "Reviewed with Riya Sharma. Single-owner payment module handed over to Arjun with updated runbook."
}
```
- **Response `200 OK`**:
```json
{
  "status": "approved",
  "version": "1.0.0",
  "handover_id": "hv-v1.0",
  "approved_by": "maya",
  "approved_at": "2026-11-08T16:00:00Z",
  "claims_included": 14,
  "message": "Handover version 1.0.0 successfully frozen and published."
}
```

---

### 13. `GET /api/handover`
Retrieves the frozen, approved handover snapshot. Role-filtered for the viewer.

- **Headers**: `X-User-Id: arjun` (Clearance 1)
- **Response `200 OK`**:
```json
{
  "version": "1.0.0",
  "project_id": "campusconnect",
  "approved_by": "maya",
  "approved_at": "2026-11-08T16:00:00Z",
  "notes": "Reviewed with Riya Sharma. Single-owner payment module handed over to Arjun with updated runbook.",
  "viewer_clearance": 1,
  "claims": [
    {
      "id": "clm-001",
      "type": "decision",
      "text": "SQLite with WAL mode adopted for high-performance single-node ticket checkout.",
      "quote": "WAL mode handles our 200 concurrent checkout queries with zero lock contention.",
      "status": "verified",
      "access_level": 1,
      "owner": "Arjun Rao"
    }
  ],
  "acknowledged": false
}
```
*(If no approved handover exists, returns `404 Not Found` with message `"No approved handover published yet."`)*

---

### 14. `POST /api/acknowledge`
Successor marks that they have read and acknowledged the approved handover.

- **Headers**: `X-User-Id: arjun`
- **Request Body**:
```json
{
  "handover_version_id": "hv-v1.0",
  "note": "Understood the payment reconciliation architecture and quarterly key rotation policy."
}
```
- **Response `200 OK`**:
```json
{
  "status": "success",
  "acknowledgement_id": "ack-001",
  "user_id": "arjun",
  "acknowledged_at": "2026-11-08T16:15:00Z"
}
```

---

### 15. `GET /api/audit`
Returns immutable audit trail of actions taken.

- **Headers**: `X-User-Id: maya`
- **Response `200 OK`**:
```json
[
  {
    "id": "aud-001",
    "user_id": "maya",
    "action": "APPROVE_HANDOVER",
    "target_type": "handover",
    "target_id": "hv-v1.0",
    "timestamp": "2026-11-08T16:00:00Z",
    "details": "Published handover v1.0.0 with 14 approved claims."
  }
]
```

---

### 16. `POST /api/ask` (Stretch AI Q&A)
Queries project knowledge using permitted, approved content only, returning citations.

- **Headers**: `X-User-Id: arjun` (Clearance 1)
- **Request Body**:
```json
{
  "project_id": "campusconnect",
  "question": "What is the policy for rotating payment API keys?"
}
```
- **Response `200 OK`**:
```json
{
  "answer": "Payment API keys rotate quarterly (every 90 days). While an older ticket suggested monthly rotations, the lead architectural decision finalized quarterly rotations to prevent webhook downtime.",
  "citations": [
    {
      "source_ref": "Architecture Meeting 2026-09-15",
      "quote": "We agreed to rotate external API keys quarterly (90 days) to avoid breaking webhook integrations.",
      "access_level": 1
    }
  ],
  "confidence": "high"
}
```

---

## 7. Client & Server Invariants

1. **Viewer Clearance Header**: The frontend must send `X-User-Id` on all API requests. The UI provides a simulated user-switcher pill in the navigation header (`riya`, `maya`, `arjun`).
2. **Server-Side Enforcement**: The frontend must never attempt client-side filtering as a security barrier. The backend strips all entities with `access_level > viewer.clearance`.
3. **Exact Quote Validation**: A claim cannot transition to `status: verified` unless the backend verification service matches its `quote` substring inside an authorized evidence text.
4. **Lead-Only Mutations**: Calling `PATCH /api/claims/{id}` or `POST /api/approve` with a user whose role is not `lead` returns HTTP `403 Forbidden`.

