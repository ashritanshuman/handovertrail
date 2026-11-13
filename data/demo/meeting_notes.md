# CampusConnect Engineering & Transition Meeting Notes

---

## Unit ev-notes-001: Sprint 24 Architecture Kickoff
- **Date**: 2026-09-03T11:00:00Z
- **Location**: Meeting Rooms/Virtual-A
- **Author**: Maya Patel
- **Access Level**: 1

The team ratified the service architecture for CampusConnect. Frontend will use React with Vite and Tailwind CSS. The backend core service will run FastAPI with SQLite in WAL mode during Phase 1 for maximum development velocity.

---

## Unit ev-notes-002: Security Review & Key Rotation Consensus (12 Oct)
- **Date**: 2026-10-12T15:00:00Z
- **Location**: notes 12 Oct, para 3
- **Author**: Maya Patel
- **Access Level**: 1

Discussion on API key rotation for payment gateways and university partners. While initial ticket documentation recommended monthly cycles, we agreed to rotate external API keys quarterly (90 days) to avoid breaking webhook integrations across multi-vendor event partners.

---

## Unit ev-notes-003: Single-Owner Knowledge Risk Discussion
- **Date**: 2026-09-18T10:30:00Z
- **Location**: Meeting Rooms/1-on-1
- **Author**: Maya Patel
- **Access Level**: 2

Maya noted that Riya Sharma is the only engineer who understands the core payment reconciliation ledger and Stripe retry mechanics. Maya requested Riya write an emergency runbook and conduct a recorded knowledge walkthrough for Arjun before her departure.

---

## Unit ev-notes-004: Ticket Reservation Concurrency Spike Review
- **Date**: 2026-09-24T14:00:00Z
- **Location**: Meeting Rooms/Tech-Sync
- **Author**: Riya Sharma
- **Access Level**: 1

Riya presented the benchmark results for seat reservation locks. In-memory locks fail when workers scale across multiple uvicorn processes. We agreed that row-level locks via SQLite transaction isolation with immediate timeout handling will be our primary lock mechanism.

---

## Unit ev-notes-005: Third-Party Vendor Dependencies
- **Date**: 2026-09-29T16:00:00Z
- **Location**: Meeting Rooms/Vendor-Review
- **Author**: Maya Patel
- **Access Level**: 1

Vendor dependency review: University SMS Gateway (Twilio provider contract) requires a minimum 2-week notice for sender ID re-verification if our domain moves to a new AWS IP range.

---

## Unit ev-notes-006: Riya Transition & Leaver Roadmap Signoff
- **Date**: 2026-10-03T09:00:00Z
- **Location**: Private HR / Director Room
- **Author**: Maya Patel
- **Access Level**: 2

Confidential Transition Meeting: Riya Sharma's last working day confirmed as 2026-11-15. Maya and HR approved the transition checklist including accelerated equity vesting milestone signoff, knowledge handover requirements to Arjun, and revoking production SSH bastion access on the final Friday.

---

## Unit ev-notes-007: Incident Post-Mortem: Student Portal 504 Timeouts
- **Date**: 2026-10-07T11:30:00Z
- **Location**: Meeting Rooms/PostMortem
- **Author**: Arjun Rao
- **Access Level**: 1

Root cause of 504 timeouts: PostgreSQL connection pool exhaustion occurred due to unclosed database cursors during CSV analytics export. Riya patched the streaming generator to ensure connection release on early client disconnect.

---

## Unit ev-notes-008: External Contact & Regulatory Point of Contact
- **Date**: 2026-10-11T13:00:00Z
- **Location**: Meeting Rooms/Compliance
- **Author**: Maya Patel
- **Access Level**: 1

University compliance officer contact: Dr. Sarah Lin (sarah.lin@university.edu, Office: Hall 4-B) is the primary contact for FERPA and student privacy audits regarding ticketing transaction histories.

---

## Unit ev-notes-009: Database Backup & Disaster Recovery Runbook
- **Date**: 2026-10-14T10:00:00Z
- **Location**: Meeting Rooms/Ops-Sync
- **Author**: Riya Sharma
- **Access Level**: 1

Operational decision: Daily SQLite database snapshots are uploaded to private S3 bucket `s3://campusconnect-backups-prod` at 03:00 UTC using cron with AES-256 server-side encryption. Retention period is 30 days.

---

## Unit ev-notes-010: Final Handover Readiness Gate
- **Date**: 2026-10-16T15:30:00Z
- **Location**: Meeting Rooms/Lead-Sync
- **Author**: Maya Patel
- **Access Level**: 2

Maya reviewed handover readiness. Confirmed that all claims must be verified with source evidence quotes and signed off before Arjun takes primary on-call rotation for the campus Spring Festival launch.

---

## Unit ev-notes-011: Sprint 31 Owner Transition Review
- **Date**: 2026-10-26T14:00:00Z
- **Location**: Meeting Rooms/Lead-Sync
- **Author**: Maya Patel
- **Access Level**: 2

Maya Patel has assumed primary ownership of the payment reconciliation failover and Stripe webhook retry mechanics to prepare for Riya's departure.

---

## Unit ev-notes-012: iOS APNS Certificate Cutover Decision
- **Date**: 2026-10-28T16:00:00Z
- **Location**: Meeting Rooms/Mobile-Sync
- **Author**: Maya Patel
- **Access Level**: 1

Decision on iOS APNS enterprise certificate cutover: Team agreed on November 15 as the hard cutover deadline to provide a two-week safety buffer before production expiration.


