from datetime import datetime, timezone
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import HandoverVersion, Acknowledgement, Claim, User, AuditLog
from app.schemas import (
    HandoverApproveRequest,
    HandoverVersionRead,
    AcknowledgeRequest,
    ClaimRead,
    ConflictDetail,
)
from app.security import get_current_user, require_lead
from app.services.handover import partition_handover_sections, generate_first_7_days_plan

router = APIRouter(prefix="/api", tags=["Handover"])


@router.post("/approve")
def approve_handover(
    payload: HandoverApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),  # Lead only!
):
    """
    Approves and freezes an immutable handover snapshot (lead only).
    Refuses with 409 listing blockers if any claim is still 'draft' AND conflicting or missing,
    unless acknowledge_unresolved=True.
    Snapshots confirmed/edited non-rejected claims into handover_versions, increments version,
    and writes audit log.
    """
    all_project_claims = (
        db.query(Claim)
        .filter(Claim.project_id == payload.project_id)
        .all()
    )

    # 1. Check for unresolved blockers (draft conflicting or draft missing claims)
    blockers = [
        f"{c.id} ({c.type}): {c.text[:50]}... [{c.status}]"
        for c in all_project_claims
        if c.review_state == "draft" and c.status in ("conflicting", "missing")
    ]

    if blockers and not payload.acknowledge_unresolved:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Cannot approve handover: unresolved draft conflicting or missing claims exist.",
                "blockers": blockers,
                "hint": "Resolve the conflicts/gaps or pass acknowledge_unresolved=true to override.",
            },
        )

    # 2. Select eligible non-rejected claims for the snapshot
    eligible_claims = [
        c for c in all_project_claims
        if c.review_state != "rejected"
    ]

    if not eligible_claims:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot approve handover: No eligible non-rejected claims found.",
        )

    claims_snapshot = [
        {
            "id": c.id,
            "project_id": c.project_id,
            "type": c.type,
            "text": c.text,
            "owner": c.owner,
            "status": c.status,
            "evidence_ids": c.evidence_ids or [],
            "quote": c.quote,
            "access_level": c.access_level,
            "review_state": c.review_state,
            "version": c.version,
            "origin": c.origin,
            "conflict_group_id": c.conflict_group_id,
        }
        for c in eligible_claims
    ]

    # Increment version
    existing_count = db.query(HandoverVersion).filter(HandoverVersion.project_id == payload.project_id).count()
    version_str = f"1.{existing_count}.0" if existing_count > 0 else "1.0.0"
    handover_id = f"hv-v{version_str}"

    hv_obj = HandoverVersion(
        id=handover_id,
        project_id=payload.project_id,
        version=version_str,
        snapshot_json=claims_snapshot,
        approved_by=current_user.id,
        approved_at=datetime.now(timezone.utc),
        notes=payload.notes or "",
    )
    db.merge(hv_obj)

    audit = AuditLog(
        id=f"aud-appr-{uuid.uuid4().hex[:12]}",
        actor=current_user.id,
        action="APPROVE_HANDOVER",
        entity="handover",
        entity_id=handover_id,
        details=f"Lead {current_user.id} approved handover version {version_str} with {len(claims_snapshot)} claims.",
    )
    db.add(audit)
    db.commit()

    return {
        "status": "approved",
        "version": version_str,
        "handover_id": handover_id,
        "approved_by": current_user.id,
        "approved_at": hv_obj.approved_at,
        "claims_included": len(claims_snapshot),
        "message": f"Handover version {version_str} successfully frozen and published.",
    }


@router.get("/handover", response_model=HandoverVersionRead)
def get_approved_handover(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the approved handover snapshot, strictly re-filtered at render time by viewer clearance.
    If nothing is approved: 200 with state 'not_approved' and no claims.
    Returns sections, first_7_days list, and hidden_count.
    """
    hv = (
        db.query(HandoverVersion)
        .order_by(HandoverVersion.approved_at.desc())
        .first()
    )
    if not hv:
        return HandoverVersionRead(
            state="not_approved",
            version="",
            project_id="campusconnect",
            approved_by=None,
            approved_at=None,
            notes=None,
            viewer_clearance=current_user.clearance,
            claims=[],
            sections=None,
            first_7_days=None,
            hidden_count=0,
            acknowledged=False,
        )

    raw_claims = hv.snapshot_json or []
    visible_raw = []
    hidden_count = 0

    for c in raw_claims:
        if c.get("access_level", 1) <= current_user.clearance:
            visible_raw.append(c)
        else:
            hidden_count += 1

    visible_claims = [ClaimRead(**c) for c in visible_raw]

    # Partition into sections and generate First 7 Days plan
    sections_raw = partition_handover_sections(visible_raw)
    sections_read = {
        sec_name: [ClaimRead(**c) for c in c_list]
        for sec_name, c_list in sections_raw.items()
    }
    first_7_days = generate_first_7_days_plan(visible_raw)

    ack = (
        db.query(Acknowledgement)
        .filter(
            Acknowledgement.version_id == hv.id,
            Acknowledgement.user_id == current_user.id,
        )
        .first()
    )

    return HandoverVersionRead(
        state="approved",
        version=hv.version,
        project_id=hv.project_id,
        approved_by=hv.approved_by,
        approved_at=hv.approved_at,
        notes=hv.notes,
        viewer_clearance=current_user.clearance,
        claims=visible_claims,
        sections=sections_read,
        first_7_days=first_7_days,
        hidden_count=hidden_count,
        acknowledged=bool(ack),
    )


@router.post("/acknowledge")
def acknowledge_handover(
    payload: AcknowledgeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Records successor receipt and acknowledgement of the approved handover.
    Idempotent.
    """
    hv = (
        db.query(HandoverVersion)
        .filter(
            (HandoverVersion.id == payload.handover_version_id)
            | (HandoverVersion.id.like(f"{payload.handover_version_id}%"))
            | (HandoverVersion.version == payload.handover_version_id.replace("hv-v", ""))
        )
        .first()
    )
    if not hv:
        # Fallback to latest approved version
        hv = db.query(HandoverVersion).order_by(HandoverVersion.approved_at.desc()).first()
        if not hv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Handover version '{payload.handover_version_id}' not found.",
            )

    ack_id = f"ack-{current_user.id}-{hv.id}"
    ack = (
        db.query(Acknowledgement)
        .filter(
            Acknowledgement.version_id == hv.id,
            Acknowledgement.user_id == current_user.id,
        )
        .first()
    )

    if not ack:
        ack = Acknowledgement(
            id=ack_id,
            version_id=hv.id,
            user_id=current_user.id,
            at=datetime.now(timezone.utc),
            note=payload.note or "",
        )
        db.add(ack)
    else:
        ack.at = datetime.now(timezone.utc)
        if payload.note:
            ack.note = payload.note

    audit = AuditLog(
        id=f"aud-ack-{uuid.uuid4().hex[:12]}",
        actor=current_user.id,
        action="ACKNOWLEDGE",
        entity="handover",
        entity_id=hv.id,
        details=f"User {current_user.id} acknowledged handover version {hv.version}.",
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "acknowledgement_id": ack.id,
        "user_id": current_user.id,
        "acknowledged_at": ack.at,
    }
