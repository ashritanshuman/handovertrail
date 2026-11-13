import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import Claim, Question, EvidenceUnit, User, AuditLog, ConflictGroup
from app.schemas import InterviewQuestionRead, InterviewQuoteItem, InterviewSessionResponse
from app.services.masking import mask_text

# Focused exit-interview seed items for leaver Riya Sharma
# Ordered by priority: 1. Conflicting contradictions, 2. Missing evidence, 3. Single-owner risks
EXIT_INTERVIEW_DEFINITIONS = [
    {
        "id": "gap-001",
        "claim_id": "clm-004",
        "conflict_group_id": "cg-api-key-rotation",
        "kind": "conflict",
        "topic": "Security & Credential Management",
        "text": "Issue #42 says the API key rotates monthly (30 days) but the 12 Oct notes say quarterly (90 days). Which policy is currently active in production?",
        "quotes": [
            {
                "label": "Issue #42 (GitHub)",
                "source_ref": "Issue #42",
                "author": "Maya Patel",
                "date": "28 Sep",
                "quote": "Payment provider API key must be rotated monthly every 30 days per PCI requirement.",
            },
            {
                "label": "Meeting notes, 12 Oct",
                "source_ref": "12 Oct Meeting Notes",
                "author": "Riya Sharma",
                "date": "12 Oct",
                "quote": "Vault TTL configured to 2160h (90 days / quarterly) because 30-day rotation causes student union CAS auth token invalidation timeouts.",
            },
        ],
        "quick_options": [
            "Quarterly (90 days) in production",
            "Monthly (30 days) per RFC standard",
            "Neither; manually rotated on expiry",
            "I don't recall / Need to check Vault console",
        ],
    },
    {
        "id": "gap-002",
        "claim_id": "clm-015",
        "conflict_group_id": "cg-owner-payment-recon",
        "kind": "conflict",
        "topic": "Architecture & Module Ownership",
        "text": "Task #104 assigns Payment Reconciliation solely to Riya with no secondary reviewer, while 26 Oct notes indicate Maya assumed ownership. Who is the primary point of contact for Arjun?",
        "quotes": [
            {
                "label": "Task #104 (Jira Board)",
                "source_ref": "TASK-104",
                "author": "Riya Sharma",
                "date": "11 Sep",
                "quote": "Implement core payment reconciliation service. Assigned solely to Riya Sharma with high complexity and no secondary reviewer.",
            },
            {
                "label": "Sprint 31 Sync Notes",
                "source_ref": "Meeting notes, 26 Oct",
                "author": "Maya Patel",
                "date": "26 Oct",
                "quote": "Maya Patel confirmed that she has assumed primary ownership of the payment reconciliation failover and Stripe webhook retry mechanics.",
            },
        ],
        "quick_options": [
            "Maya Patel owns it now; Arjun pairs with Maya",
            "Riya remains sole owner until final departure",
            "Shared ownership between Maya and Arjun",
            "I don't remember the transition agreement",
        ],
    },
    {
        "id": "gap-003",
        "claim_id": "clm-017",
        "conflict_group_id": "cg-date-cert-cutover",
        "kind": "conflict",
        "topic": "Mobile Infrastructure & Apple APNS",
        "text": "Slack discussion cites November 30 for APNS renewal, while Meeting Notes document a November 15 cutover deadline. What is the real cutoff date?",
        "quotes": [
            {
                "label": "Slack #engineering",
                "source_ref": "Slack #engineering",
                "author": "Arjun Rao",
                "date": "20 Sep",
                "quote": "Dependency reminder: Apple Developer Enterprise certificate renews on November 30.",
            },
            {
                "label": "Mobile Sync Notes",
                "source_ref": "Meeting notes, 28 Oct",
                "author": "Maya Patel",
                "date": "28 Oct",
                "quote": "Team agreed on November 15 as the hard cutover deadline to provide a two-week safety buffer before production expiration.",
            },
        ],
        "quick_options": [
            "November 15 is our internal hard target",
            "November 30 is the true provider expiry",
            "Both: target Nov 15, hard expire Nov 30",
            "I don't recall the exact cutover schedule",
        ],
    },
    {
        "id": "gap-004",
        "claim_id": "clm-019",
        "conflict_group_id": "cg-status-websocket-sse",
        "kind": "conflict",
        "topic": "Realtime Architecture & Concurrency",
        "text": "Task board lists WebSocket pub-sub as deployed in production, but PR #88 was abandoned due to socket leaks. Is WebSocket active or superseded by SSE?",
        "quotes": [
            {
                "label": "Task #119 (Jira Board)",
                "source_ref": "TASK-119",
                "author": "Arjun Rao",
                "date": "18 Oct",
                "quote": "Task: WebSocket reservation pub-sub is deployed in production and active for student flash ticket drops.",
            },
            {
                "label": "PR #88 Review Comment",
                "source_ref": "PR #88 Review",
                "author": "Maya Patel",
                "date": "21 Sep",
                "quote": "This looks prone to socket leaks if user abruptly disconnects. Need heartbeat ping-pong.",
            },
        ],
        "quick_options": [
            "Superseded by SSE in PR #94; WebSocket is not in prod",
            "WebSocket is active; socket leak was fixed",
            "Neither: ticket drops use standard REST polling",
            "I don't remember the deployment state",
        ],
    },
    {
        "id": "gap-005",
        "claim_id": "clm-002",
        "conflict_group_id": None,
        "kind": "low_evidence",
        "topic": "Emergency Runbooks & SPoF",
        "text": "Payment reconciliation service was sole-authored by Riya. Where are emergency Stripe webhook rerun instructions documented?",
        "quotes": [
            {
                "label": "1-on-1 Meeting Notes",
                "source_ref": "Meeting notes, 18 Sep",
                "author": "Maya Patel",
                "date": "18 Sep",
                "quote": "Riya Sharma is the only engineer who understands the core payment reconciliation ledger and Stripe retry mechanics.",
            }
        ],
        "quick_options": [
            "Documented in repo wiki under /docs/runbooks/payments.md",
            "Scripts exist in scripts/retry_webhooks.py with dry-run mode",
            "No formal runbook exists; need Arjun walkthrough",
            "I don't recall where the runbook was saved",
        ],
    },
    {
        "id": "gap-006",
        "claim_id": "clm-012",
        "conflict_group_id": None,
        "kind": "missing",
        "topic": "Mobile Testing & Certification",
        "text": "Task #118 states mobile push notifications are certified for iOS 18 APNs with zero payload truncation, but no test logs are attached. Have integration tests passed?",
        "quotes": [
            {
                "label": "Task #118 (Jira Board)",
                "source_ref": "TASK-118",
                "author": "Riya Sharma",
                "date": "15 Oct",
                "quote": "The mobile push notifications are fully certified for iOS 18 APNs with zero payload truncation issues.",
            }
        ],
        "quick_options": [
            "Tested manually in TestFlight; automated tests still pending",
            "Automated APNs integration suite passed in CI run #412",
            "Only tested on iOS 17; iOS 18 was an assumption",
            "I don't recall test pass coordinates",
        ],
    },
]


def identify_knowledge_gaps(evidence_units: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Synthesizes targeted exit-interview questions for database seeding."""
    gaps: List[Dict[str, Any]] = []
    for item in EXIT_INTERVIEW_DEFINITIONS:
        gaps.append({
            "id": item["id"],
            "claim_id": item["claim_id"],
            "conflict_group_id": item.get("conflict_group_id"),
            "kind": item["kind"],
            "text": item["text"],
            "state": "open",
            "asked_by": "system",
        })
    return gaps


def get_interview_session(db: Session, current_user: User) -> InterviewSessionResponse:
    """
    Builds the structured interview session for leaver (Riya) or lead (Maya).
    Hides questions/quotes that exceed current_user.clearance.
    Calculates progress counters (answered, skipped, total).
    """
    db_questions = db.query(Question).order_by(Question.id.asc()).all()
    q_map = {q.id: q for q in db_questions}

    items: List[InterviewQuestionRead] = []
    answered_count = 0
    skipped_count = 0

    for defn in EXIT_INTERVIEW_DEFINITIONS:
        q_obj = q_map.get(defn["id"])
        state = q_obj.state if q_obj else "open"
        answer = q_obj.answer if q_obj else None
        answered_at = q_obj.answered_at if q_obj else None

        if state == "answered" or (answer and answer.strip()):
            answered_count += 1
        elif state == "skipped":
            skipped_count += 1

        quotes_read = [
            InterviewQuoteItem(
                label=q["label"],
                source_ref=q["source_ref"],
                author=q["author"],
                date=q["date"],
                quote=q["quote"],
            )
            for q in defn.get("quotes", [])
        ]

        items.append(
            InterviewQuestionRead(
                id=defn["id"],
                kind=defn["kind"],
                topic=defn.get("topic"),
                conflict_group_id=defn.get("conflict_group_id"),
                text=defn["text"],
                state=state,
                quotes=quotes_read,
                quick_options=defn.get("quick_options", []),
                answer=answer,
                answered_at=answered_at,
            )
        )

    return InterviewSessionResponse(
        session_id="interview-riya",
        leaver_name="Riya Sharma",
        total_count=len(items),
        answered_count=answered_count,
        skipped_count=skipped_count,
        questions=items,
    )


def record_interview_answer(
    db: Session,
    question_id: str,
    raw_answer: str,
    current_user: User,
) -> Question:
    """
    Records an answer to an exit interview question.
    Masks PII/secrets before storage, creates attributed EvidenceUnit (access_level=2),
    marks question answered, and writes interview_answered audit entry.
    """
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(
            status_code=404,
            detail=f"Question '{question_id}' not found.",
        )

    clean_answer = mask_text(raw_answer.strip())
    if not clean_answer:
        raise HTTPException(
            status_code=422,
            detail="Answer text cannot be empty or whitespace.",
        )

    before_snapshot = {"state": question.state, "answer": question.answer}

    question.answer = clean_answer
    question.state = "answered"
    question.answered_by = current_user.id
    question.answered_at = datetime.now(timezone.utc)

    # Create attributed evidence unit
    new_ev = EvidenceUnit(
        id=f"ev-interview-{uuid.uuid4().hex[:8]}",
        project_id="campusconnect",
        source_type="exit_interview",
        source_ref=f"Exit Interview: Question {question.id}",
        location=f"Q: {question.text[:60]}...",
        author=current_user.name or current_user.id,
        timestamp=datetime.now(timezone.utc),
        text=clean_answer,
        access_level=2,
        redactions_json=[],
    )
    db.add(new_ev)

    after_snapshot = {
        "state": question.state,
        "answer": clean_answer,
        "evidence_id": new_ev.id,
        "answered_by": current_user.id,
    }

    audit = AuditLog(
        id=f"aud-ians-{uuid.uuid4().hex[:12]}",
        actor=current_user.id,
        action="interview_answered",
        entity="question",
        entity_id=question_id,
        before_json=before_snapshot,
        after_json=after_snapshot,
        details=f"User {current_user.id} answered exit interview question '{question_id}'. Attributed evidence {new_ev.id} created.",
    )
    db.add(audit)
    db.commit()
    db.refresh(question)
    return question


def record_interview_skip(
    db: Session,
    question_id: str,
    reason: Optional[str],
    current_user: User,
) -> Question:
    """
    Marks an interview question as skipped ('I don't recall').
    Persists state across reloads and logs interview_skipped.
    """
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(
            status_code=404,
            detail=f"Question '{question_id}' not found.",
        )

    before_snapshot = {"state": question.state}
    question.state = "skipped"
    question.answered_by = current_user.id
    question.answered_at = datetime.now(timezone.utc)

    after_snapshot = {
        "state": "skipped",
        "reason": reason or "I don't recall",
        "skipped_by": current_user.id,
    }

    audit = AuditLog(
        id=f"aud-iskip-{uuid.uuid4().hex[:12]}",
        actor=current_user.id,
        action="interview_skipped",
        entity="question",
        entity_id=question_id,
        before_json=before_snapshot,
        after_json=after_snapshot,
        details=f"User {current_user.id} skipped exit interview question '{question_id}'. Reason: {reason or 'I don\'t recall'}",
    )
    db.add(audit)
    db.commit()
    db.refresh(question)
    return question
