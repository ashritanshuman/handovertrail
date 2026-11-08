from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import EvidenceUnit, User
from app.schemas import EvidenceUnitRead
from app.security import get_current_user

router = APIRouter(prefix="/api/evidence", tags=["Evidence"])


@router.get("", response_model=List[EvidenceUnitRead])
def list_evidence(
    source_type: Optional[str] = Query(None, description="Filter by source type (github, jira, meeting_notes, slack)"),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns ingested evidence units strictly filtered by the viewer's clearance level.
    """
    query = db.query(EvidenceUnit).filter(
        EvidenceUnit.access_level <= current_user.clearance
    )
    if source_type:
        query = query.filter(EvidenceUnit.source_type == source_type.lower())
        
    units = query.order_by(EvidenceUnit.timestamp.asc()).limit(limit).all()
    return units

