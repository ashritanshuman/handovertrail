from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Claim, Question, User
from app.schemas import StatsResponse
from app.security import get_current_user

router = APIRouter(prefix="/api/stats", tags=["Stats"])


@router.get("", response_model=StatsResponse)
def get_handover_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns consolidated readiness metrics and breakdown by status/type/state.
    """
    claims = db.query(Claim).filter(Claim.access_level <= current_user.clearance).all()
    open_gaps = db.query(Question).filter(Question.state == "open").count()

    by_status = {"verified": 0, "inferred": 0, "conflicting": 0, "missing": 0}
    by_type = {
        "decision": 0,
        "task": 0,
        "risk": 0,
        "dependency": 0,
        "open_question": 0,
        "contact": 0,
    }
    by_review_state = {"draft": 0, "confirmed": 0, "rejected": 0, "edited": 0}

    for c in claims:
        by_status[c.status] = by_status.get(c.status, 0) + 1
        by_type[c.type] = by_type.get(c.type, 0) + 1
        by_review_state[c.review_state] = by_review_state.get(c.review_state, 0) + 1

    total = len(claims)
    confirmed_or_verified = by_review_state.get("confirmed", 0) + by_review_state.get("edited", 0)
    
    # Readiness percentage
    readiness = 0.0
    if total > 0:
        readiness = round((confirmed_or_verified / total) * 100, 1)

    can_approve = (by_status.get("conflicting", 0) == 0) and (readiness >= 50.0)

    return StatsResponse(
        total_claims=total,
        by_status=by_status,
        by_type=by_type,
        by_review_state=by_review_state,
        open_gaps_count=open_gaps,
        readiness_percentage=readiness,
        can_approve=can_approve,
    )

