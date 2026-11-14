from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import ConflictGroup, Claim, EvidenceUnit, Question, User
from app.schemas import (
    ConflictGroupRead,
    ConflictClaimSummary,
    LeaverAnswerSummary,
    ConflictResolveRequest,
    ConflictReasonRequest,
)
from app.security import require_lead
from app.services.conflicts import sync_conflict_groups
from app.services.resolution import (
    resolve_conflict_group,
    dismiss_conflict_group,
    leave_conflict_unresolved,
)

router = APIRouter(prefix="/api/conflicts", tags=["Conflicts"])


def build_conflict_group_read(db: Session, group: ConflictGroup) -> ConflictGroupRead:
    claims = db.query(Claim).filter(Claim.conflict_group_id == group.id).all()
    ev_ids = [eid for c in claims for eid in (c.evidence_ids or [])]
    ev_units = db.query(EvidenceUnit).filter(EvidenceUnit.id.in_(ev_ids)).all() if ev_ids else []
    ev_map = {e.id: e for e in ev_units}

    claim_summaries: List[ConflictClaimSummary] = []
    for c in claims:
        first_ev_id = (c.evidence_ids or [None])[0]
        ev = ev_map.get(first_ev_id) if first_ev_id else None
        claim_summaries.append(
            ConflictClaimSummary(
                id=c.id,
                text=c.text,
                quote=c.quote or "",
                source_ref=ev.source_ref if ev else (c.evidence_ids[0] if c.evidence_ids else "evidence"),
                source_type=ev.source_type if ev else "synthetic",
                author=ev.author if ev else c.owner,
                access_level=c.access_level,
                review_state=c.review_state,
                status=c.status,
            )
        )

    linked_claim_ids = [c.id for c in claims]
    q = (
        db.query(Question)
        .filter(
            (Question.conflict_group_id == group.id) | (Question.claim_id.in_(linked_claim_ids)),
            Question.state == "answered",
            Question.answer.isnot(None),
        )
        .order_by(Question.answered_at.desc())
        .first()
    )
    leaver_ans = None
    if q and q.answer:
        leaver_ans = LeaverAnswerSummary(
            question_id=q.id,
            answer=q.answer,
            answered_by=q.answered_by,
            answered_at=q.answered_at,
        )

    return ConflictGroupRead(
        id=group.id,
        project_id=group.project_id,
        topic=group.topic,
        attribute=group.attribute,
        entity=group.entity,
        type=group.type,
        confidence=group.confidence,
        status=group.status,
        resolution_type=group.resolution_type,
        resolved_claim_id=group.resolved_claim_id,
        note=group.note,
        suggestion=group.suggestion,
        resolved_by=group.resolved_by,
        resolved_at=group.resolved_at,
        created_at=group.created_at,
        claims=claim_summaries,
        leaver_answer=leaver_ans,
    )


@router.post("/detect", response_model=List[ConflictGroupRead])
def run_conflict_detection(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),
):
    """
    Triggers rule-based conflict detection engine across project claims and updates conflict groups.
    Lead only.
    """
    groups = sync_conflict_groups(db, "campusconnect")
    return [build_conflict_group_read(db, g) for g in groups]


@router.get("", response_model=List[ConflictGroupRead])
def list_conflicts(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (open, resolved, dismissed, unresolved)"),
    type_filter: Optional[str] = Query(None, alias="type", description="Filter by type (contradiction, supersession, ambiguous)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),
):
    """
    Returns conflict groups with linked claims and leaver answers.
    Lead only.
    """
    query = db.query(ConflictGroup).filter(ConflictGroup.project_id == "campusconnect")
    if status_filter:
        query = query.filter(ConflictGroup.status == status_filter.lower())
    if type_filter:
        query = query.filter(ConflictGroup.type == type_filter.lower())
    groups = query.order_by(ConflictGroup.created_at.asc()).all()
    return [build_conflict_group_read(db, g) for g in groups]


@router.get("/{conflict_id}", response_model=ConflictGroupRead)
def get_conflict(
    conflict_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),
):
    """
    Returns a single conflict group with linked claims and leaver answers.
    Lead only.
    """
    group = db.query(ConflictGroup).filter(ConflictGroup.id == conflict_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conflict group '{conflict_id}' not found.",
        )
    return build_conflict_group_read(db, group)


@router.post("/{conflict_id}/resolve")
def resolve_conflict(
    conflict_id: str,
    payload: ConflictResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),
):
    """
    Resolves a conflict group atomically.
    Lead only.
    """
    return resolve_conflict_group(db, conflict_id, payload, current_user)


@router.post("/{conflict_id}/dismiss")
def dismiss_conflict(
    conflict_id: str,
    payload: ConflictReasonRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),
):
    """
    Dismisses a conflict group as a false positive or non-issue.
    Lead only.
    """
    return dismiss_conflict_group(db, conflict_id, payload, current_user)


@router.post("/{conflict_id}/leave-unresolved")
def mark_conflict_unresolved(
    conflict_id: str,
    payload: ConflictReasonRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),
):
    """
    Explicitly leaves a conflict unresolved with reason logged.
    Lead only.
    """
    return leave_conflict_unresolved(db, conflict_id, payload, current_user)

