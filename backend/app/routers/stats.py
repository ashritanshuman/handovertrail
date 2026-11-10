from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User
from app.schemas import StatsResponse
from app.security import get_current_user
from app.services.stats import compute_handover_stats

router = APIRouter(prefix="/api/stats", tags=["Stats"])


@router.get("", response_model=StatsResponse)
def get_handover_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns consolidated readiness metrics and breakdown by status/type/state,
    plus weekly evidence activity and last extraction origin.
    Filtered strictly by viewer clearance.
    """
    stats_data = compute_handover_stats(db, current_user)
    return StatsResponse(**stats_data)
