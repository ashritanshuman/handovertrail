from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User
from app.schemas import (
    InterviewSessionResponse,
    QuestionAnswerRequest,
    InterviewSkipRequest,
    InterviewQuestionRead,
)
from app.security import require_lead_or_leaver
from app.services.gaps import (
    get_interview_session,
    record_interview_answer,
    record_interview_skip,
)

router = APIRouter(prefix="/api/interview", tags=["Exit Interview"])


@router.get("", response_model=InterviewSessionResponse)
def get_interview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead_or_leaver),
):
    """
    Returns structured exit interview questions and leaver responses.
    Lead and Leaver only. (Arjun receives 403 Forbidden).
    """
    return get_interview_session(db, current_user)


@router.post("/{question_id}/answer")
def answer_interview_question(
    question_id: str,
    payload: QuestionAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead_or_leaver),
):
    """
    Records an answer to an exit interview question.
    Masks PII/secrets, creates attributed EvidenceUnit (access_level=2),
    marks question answered, and writes interview_answered audit entry.
    Lead and Leaver only.
    """
    q = record_interview_answer(db, question_id, payload.answer, current_user)
    return {
        "status": "answered",
        "question_id": q.id,
        "state": q.state,
        "answer": q.answer,
        "answered_by": q.answered_by,
        "answered_at": q.answered_at,
        "message": f"Answer recorded for question '{q.id}'.",
    }


@router.post("/{question_id}/skip")
def skip_interview_question(
    question_id: str,
    payload: InterviewSkipRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead_or_leaver),
):
    """
    Marks an interview question as skipped ('I don't recall').
    Persists state and logs interview_skipped.
    Lead and Leaver only.
    """
    reason = payload.reason if payload else "I don't recall"
    q = record_interview_skip(db, question_id, reason, current_user)
    return {
        "status": "skipped",
        "question_id": q.id,
        "state": q.state,
        "skipped_by": q.answered_by,
        "message": f"Question '{q.id}' skipped.",
    }
