from datetime import datetime, timezone
from typing import Dict, Any, List
from collections import defaultdict
from sqlalchemy.orm import Session
from app.models import Claim, Question, EvidenceUnit, ExtractionRun, User


def compute_handover_stats(db: Session, current_user: User) -> Dict[str, Any]:
    """
    Computes counts by status, type, review progress, readiness %,
    evidence per week (for activity chart), and last extraction origin.
    Always filters claims and evidence by viewer's clearance.
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

    readiness = 0.0
    if total > 0:
        readiness = round((confirmed_or_verified / total) * 100, 1)

    can_approve = (by_status.get("conflicting", 0) == 0) and (readiness >= 50.0)

    # Last extraction run origin
    last_run = db.query(ExtractionRun).order_by(ExtractionRun.started_at.desc()).first()
    extraction_origin = last_run.origin if last_run else "cache"

    # Evidence per week / activity
    evidence_items = db.query(EvidenceUnit).filter(EvidenceUnit.access_level <= current_user.clearance).all()
    weekly_activity: Dict[str, int] = defaultdict(int)
    for ev in evidence_items:
        if ev.timestamp:
            week_key = ev.timestamp.strftime("%Y-W%W")
            weekly_activity[week_key] += 1

    return {
        "total_claims": total,
        "by_status": by_status,
        "by_type": by_type,
        "by_review_state": by_review_state,
        "open_gaps_count": open_gaps,
        "readiness_percentage": readiness,
        "can_approve": can_approve,
        "extraction_origin": extraction_origin,
        "weekly_activity": dict(weekly_activity),
    }

