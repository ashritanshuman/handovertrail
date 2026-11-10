from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import EvidenceUnit, User
from app.schemas import TimelineEvent
from app.security import get_current_user

router = APIRouter(prefix="/api/timeline", tags=["Timeline"])


@router.get("", response_model=List[TimelineEvent])
def get_timeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns a chronological sequence of project events, PRs, decisions, and unresolved discussions,
    each with evidence references, filtered strictly by the viewer's clearance level,
    with an 'unresolved' flag for active discussion threads or abandoned branches.
    """
    units = (
        db.query(EvidenceUnit)
        .filter(EvidenceUnit.access_level <= current_user.clearance)
        .order_by(EvidenceUnit.timestamp.asc())
        .all()
    )

    unresolved_keywords = ["abandoned", "leak", "unresolved", "open question", "failover", "incident", "conflict"]

    events = []
    for u in units:
        text_lower = u.text.lower()
        is_unresolved = any(kw in text_lower for kw in unresolved_keywords)

        events.append(
            TimelineEvent(
                date=u.timestamp.strftime("%Y-%m-%d") if u.timestamp else "2026-09-01",
                title=f"{u.source_type.capitalize()}: {u.source_ref}",
                category=u.source_type,
                summary=u.text[:140] + ("..." if len(u.text) > 140 else ""),
                source_ref=u.source_ref,
                access_level=u.access_level,
                unresolved=is_unresolved,
                evidence_ids=[u.id],
            )
        )
    return events
