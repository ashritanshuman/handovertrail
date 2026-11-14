import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models import ConflictGroup, Claim, AuditLog, User, EvidenceUnit
from app.schemas import ConflictResolveRequest, ConflictReasonRequest
from app.services.verify import reverify_claim, determine_claim_verification
from app.services.masking import mask_text


def resolve_conflict_group(
    db: Session,
    conflict_id: str,
    payload: ConflictResolveRequest,
    current_user: User,
) -> Dict[str, Any]:
    """
    Resolves a conflict group atomically.
    Supports resolution_type: 'chose_claim' or 'corrected'.
    Re-runs deterministic verification, marks group resolved, and records audit trail.
    Enforces HTTP 409 if conflict group is already resolved or dismissed.
    """
    group = db.query(ConflictGroup).filter(ConflictGroup.id == conflict_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conflict group '{conflict_id}' not found.",
        )

    if group.status in ("resolved", "dismissed"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Conflict '{conflict_id}' is already {group.status} and cannot be resolved again.",
        )

    # Fetch all claims linked to this conflict group
    linked_claims = db.query(Claim).filter(Claim.conflict_group_id == conflict_id).all()
    before_snapshot = {
        "group_status": group.status,
        "claims": [{c.id: {"status": c.status, "review_state": c.review_state, "text": c.text}} for c in linked_claims],
    }

    resolved_claim_id = None
    note_text = payload.note or ""

    if payload.resolution_type == "chose_claim":
        if not payload.chosen_claim_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="chosen_claim_id is required when resolution_type is 'chose_claim'.",
            )
        chosen_claim = next((c for c in linked_claims if c.id == payload.chosen_claim_id), None)
        if not chosen_claim:
            # Fallback to direct claim lookup in project
            chosen_claim = db.query(Claim).filter(Claim.id == payload.chosen_claim_id).first()
        if not chosen_claim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chosen claim '{payload.chosen_claim_id}' not found.",
            )

        # Mark chosen claim as confirmed and origin as human
        chosen_claim.review_state = "confirmed"
        chosen_claim.origin = "human"
        chosen_claim.version += 1
        reverify_claim(chosen_claim, db)
        resolved_claim_id = chosen_claim.id

        # Mark other claims in the group as rejected
        for other in linked_claims:
            if other.id != chosen_claim.id:
                other.review_state = "rejected"
                other.version += 1

    elif payload.resolution_type == "corrected":
        if not payload.corrected_claim or not payload.corrected_claim.text.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="corrected_claim payload with non-empty text is required when resolution_type is 'corrected'.",
            )

        corr = payload.corrected_claim
        new_claim_id = f"clm-human-{uuid.uuid4().hex[:6]}"

        # Aggregate evidence IDs from all linked claims
        combined_evidence_ids = []
        for c in linked_claims:
            for eid in (c.evidence_ids or []):
                if eid not in combined_evidence_ids:
                    combined_evidence_ids.append(eid)

        new_claim = Claim(
            id=new_claim_id,
            project_id=group.project_id,
            type=corr.type,
            text=mask_text(corr.text),
            owner=corr.owner or current_user.name or "Lead",
            status="inferred",
            evidence_ids=combined_evidence_ids,
            quote=corr.quote or "",
            access_level=1,
            review_state="confirmed",
            version=1,
            origin="human",
            conflict_group_id=conflict_id,
        )
        db.add(new_claim)
        db.flush()
        reverify_claim(new_claim, db)
        resolved_claim_id = new_claim.id

        # Reject all original conflicting claims in the group
        for c in linked_claims:
            c.review_state = "rejected"
            c.version += 1

    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid resolution_type '{payload.resolution_type}'. Must be 'chose_claim' or 'corrected'.",
        )

    # Update conflict group record
    group.status = "resolved"
    group.resolution_type = payload.resolution_type
    group.resolved_claim_id = resolved_claim_id
    group.note = note_text
    group.resolved_by = current_user.id
    group.resolved_at = datetime.now(timezone.utc)

    after_snapshot = {
        "group_status": group.status,
        "resolution_type": group.resolution_type,
        "resolved_claim_id": group.resolved_claim_id,
        "note": note_text,
        "resolved_by": current_user.id,
    }

    # Record atomic audit log with agreed contract action name 'conflict_resolved'
    audit = AuditLog(
        id=f"aud-cres-{uuid.uuid4().hex[:12]}",
        actor=current_user.id,
        action="conflict_resolved",
        entity="conflict_group",
        entity_id=conflict_id,
        before_json=before_snapshot,
        after_json=after_snapshot,
        details=f"Lead {current_user.id} resolved conflict '{conflict_id}' via '{payload.resolution_type}'. Note: {note_text[:100]}",
    )
    db.add(audit)
    db.commit()

    return {
        "status": "resolved",
        "conflict_id": conflict_id,
        "resolution_type": payload.resolution_type,
        "resolved_claim_id": resolved_claim_id,
        "message": f"Conflict '{conflict_id}' resolved successfully.",
    }


def dismiss_conflict_group(
    db: Session,
    conflict_id: str,
    payload: ConflictReasonRequest,
    current_user: User,
) -> Dict[str, Any]:
    """
    Dismisses a conflict group as a false positive or non-issue (lead only).
    Requires a non-empty reason.
    """
    group = db.query(ConflictGroup).filter(ConflictGroup.id == conflict_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conflict group '{conflict_id}' not found.",
        )

    if group.status in ("resolved", "dismissed"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Conflict '{conflict_id}' is already {group.status}.",
        )

    reason = payload.reason.strip()
    if not reason:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A non-empty reason is required to dismiss a conflict.",
        )

    before_snapshot = {"status": group.status}
    group.status = "dismissed"
    group.resolution_type = "dismissed"
    group.note = reason
    group.resolved_by = current_user.id
    group.resolved_at = datetime.now(timezone.utc)

    # Re-verify claims so status changes from conflicting to verified/inferred
    linked_claims = db.query(Claim).filter(Claim.conflict_group_id == conflict_id).all()
    for c in linked_claims:
        cited_units = (
            db.query(EvidenceUnit).filter(EvidenceUnit.id.in_(c.evidence_ids or [])).all()
            if c.evidence_ids
            else []
        )
        new_status, new_level = determine_claim_verification(
            claim_type=c.type,
            claim_text=c.text,
            quote=c.quote,
            cited_units=cited_units,
        )
        c.status = new_status
        c.access_level = new_level

    after_snapshot = {
        "status": group.status,
        "note": reason,
        "resolved_by": current_user.id,
    }

    audit = AuditLog(
        id=f"aud-cdis-{uuid.uuid4().hex[:12]}",
        actor=current_user.id,
        action="conflict_dismissed",
        entity="conflict_group",
        entity_id=conflict_id,
        before_json=before_snapshot,
        after_json=after_snapshot,
        details=f"Lead {current_user.id} dismissed conflict '{conflict_id}'. Reason: {reason}",
    )
    db.add(audit)
    db.commit()

    return {
        "status": "dismissed",
        "conflict_id": conflict_id,
        "message": f"Conflict '{conflict_id}' dismissed.",
    }


def leave_conflict_unresolved(
    db: Session,
    conflict_id: str,
    payload: ConflictReasonRequest,
    current_user: User,
) -> Dict[str, Any]:
    """
    Explicitly defers a conflict group as unresolved.
    Will continue to block or warn on approval unless acknowledge_unresolved=True.
    """
    group = db.query(ConflictGroup).filter(ConflictGroup.id == conflict_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conflict group '{conflict_id}' not found.",
        )

    reason = payload.reason.strip()
    if not reason:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A non-empty reason is required to leave a conflict unresolved.",
        )

    before_snapshot = {"status": group.status}
    group.status = "unresolved"
    group.resolution_type = "left_unresolved"
    group.note = reason
    group.resolved_by = current_user.id
    group.resolved_at = datetime.now(timezone.utc)

    after_snapshot = {
        "status": group.status,
        "note": reason,
        "resolved_by": current_user.id,
    }

    audit = AuditLog(
        id=f"aud-cunres-{uuid.uuid4().hex[:12]}",
        actor=current_user.id,
        action="conflict_left_unresolved",
        entity="conflict_group",
        entity_id=conflict_id,
        before_json=before_snapshot,
        after_json=after_snapshot,
        details=f"Lead {current_user.id} marked conflict '{conflict_id}' as unresolved. Reason: {reason}",
    )
    db.add(audit)
    db.commit()

    return {
        "status": "unresolved",
        "conflict_id": conflict_id,
        "message": f"Conflict '{conflict_id}' marked as unresolved.",
    }

