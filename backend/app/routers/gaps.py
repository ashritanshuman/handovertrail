from datetime import datetime, timezone
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Question, User, AuditLog
from app.schemas import QuestionRead, QuestionAnswerRequest
from app.security import get_current_user

router = APIRouter(prefix="/api/gaps", tags=["Gaps"])


@router.get("", response_model=List[QuestionRead])
def list_gaps(
    state: Optional[str] = Query(None, description="Filter by state (open, answered, dismissed)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns knowledge gaps and questions requiring leaver answers.
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
    current_user: User = Depends(get_current_user),
):
    """
    Records an answer to an open knowledge gap.
    """
    gap = db.query(Question).filter(Question.id == gap_id).first()
    if not gap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Gap '{gap_id}' not found.",
        )

    gap.answer = payload.answer
    gap.state = "answered"
    gap.answered_by = current_user.id
    gap.answered_at = datetime.now(timezone.utc)

    audit = AuditLog(
        id=f"aud-gap-{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        action="ANSWER_GAP",
        target_type="gap",
        target_id=gap_id,
        details=f"User {current_user.id} provided answer to gap '{gap_id}'.",
    )
    db.add(audit)
    db.commit()
    db.refresh(gap)

    return gap
