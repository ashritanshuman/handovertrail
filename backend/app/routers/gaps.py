from datetime import datetime, timezone
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.db import get_db
from app.models import Question, User, AuditLog, EvidenceUnit
from app.schemas import QuestionRead, QuestionAnswerRequest
from app.security import get_current_user, require_lead_or_leaver
from app.services.masking import mask_text

router = APIRouter(prefix="/api/gaps", tags=["Gaps"])


@router.get("", response_model=List[QuestionRead])
def list_gaps(
    state: Optional[str] = Query(None, description="Filter by state (open, answered, dismissed)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns knowledge gaps and questions requiring leaver answers.
    Visible to all project members to understand open questions.
    """
    query = db.query(Question)
    if state:
        query = query.filter(Question.state == state.lower())
    questions = query.order_by(Question.created_at.asc()).all()
    return questions


@router.post("/{gap_id}/answer", response_model=QuestionRead)
def answer_gap(
    gap_id: str,
    payload: QuestionAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead_or_leaver),
):
    """
    Records an answer to an open knowledge gap (leaver or lead only).
    Stores answer, marks state as answered, and records the answer as new attributed evidence
    (source_type: 'exit_interview', author: current_user.name, access_level: 2)
    that the lead can use to resolve conflicts.
    """
    gap = db.query(Question).filter(or_(Question.id == gap_id, func.lower(Question.id) == gap_id.lower())).first()
    if not gap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Gap '{gap_id}' not found.",
        )

    masked_ans = mask_text(payload.answer.strip())
    gap.answer = masked_ans
    gap.state = "answered"
    gap.answered_by = current_user.id
    gap.answered_at = datetime.now(timezone.utc)

    # Record answer as new attributed evidence unit (source_type 'exit_interview', access_level 2)
    new_ev = EvidenceUnit(
        id=f"ev-interview-{uuid.uuid4().hex[:8]}",
        project_id="campusconnect",
        source_type="exit_interview",
        source_ref=f"Exit Interview: Gap {gap.id}",
        location=f"Q: {gap.text[:60]}...",
        author=current_user.name or current_user.id,
        timestamp=datetime.now(timezone.utc),
        text=masked_ans,
        access_level=2,
        redactions_json=[],
    )
    db.add(new_ev)

    audit = AuditLog(
        id=f"aud-gap-{uuid.uuid4().hex[:12]}",
        actor=current_user.id,
        action="ANSWER_GAP",
        entity="gap",
        entity_id=gap_id,
        details=f"User {current_user.id} provided exit interview answer for gap '{gap_id}'. Attributed evidence {new_ev.id} created.",
    )
    db.add(audit)
    db.commit()
    db.refresh(gap)

    return gap
