from datetime import datetime, timezone
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import HandoverVersion, Acknowledgement, Claim, User, AuditLog
from app.schemas import (
    HandoverApproveRequest,
    HandoverVersionRead,
    AcknowledgeRequest,
    ClaimRead,
)
from app.security import get_current_user, require_lead

router = APIRouter(prefix="/api", tags=["Handover"])


@router.post("/approve")
def approve_handover(
    payload: HandoverApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),  # Lead only!
):
    """
    Approves and freezes an immutable handover snapshot. Requires Lead role (Maya).
    """
    claims = (
        db.query(Claim)
        .filter(
            Claim.project_id == payload.project_id,
            Claim.review_state.in_(["confirmed", "edited", "draft"]),
            Claim.status != "conflicting",
        )
        .all()
    )

    if not claims:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot approve handover: No non-conflicting claims available.",
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
        }
        for c in claims
    ]

    version_str = "1.0.0"
    handover_id = "hv-v1.0"
    
    existing = db.query(HandoverVersion).filter(HandoverVersion.id == handover_id).first()
    if existing:
        existing.snapshot_json = claims_snapshot
        existing.approved_by = current_user.id
        existing.approved_at = datetime.now(timezone.utc)
        existing.notes = payload.notes or ""
        hv_obj = existing
    else:
        hv_obj = HandoverVersion(
            id=handover_id,
            project_id=payload.project_id,
            version=version_str,
            snapshot_json=claims_snapshot,
            approved_by=current_user.id,
            approved_at=datetime.now(timezone.utc),
            notes=payload.notes or "",
        )
        db.add(hv_obj)

    audit = AuditLog(
        id=f"aud-appr-{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        action="APPROVE_HANDOVER",
        target_type="handover",
        target_id=handover_id,
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
    Returns the approved handover snapshot, strictly filtered by viewer clearance.
    """
    hv = (
        db.query(HandoverVersion)
        .order_by(HandoverVersion.approved_at.desc())
        .first()
    )
    if not hv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No approved handover published yet. Lead must approve first via POST /api/approve.",
        )

    raw_claims = hv.snapshot_json or []
    filtered_claims = []
    for c in raw_claims:
        if c.get("access_level", 1) <= current_user.clearance:
            filtered_claims.append(ClaimRead(**c))

    ack = (
        db.query(Acknowledgement)
        .filter(
            Acknowledgement.handover_version_id == hv.id,
            Acknowledgement.user_id == current_user.id,
        )
        .first()
    )

    return HandoverVersionRead(
        version=hv.version,
        project_id=hv.project_id,
        approved_by=hv.approved_by,
        approved_at=hv.approved_at,
        notes=hv.notes,
        viewer_clearance=current_user.clearance,
        claims=filtered_claims,
        acknowledged=bool(ack),
    )


@router.post("/acknowledge")
def acknowledge_handover(
    payload: AcknowledgeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Records successor acknowledgement of the handover.
    """
    # Accept matches like hv-v1.0 or hv-v1.0.0
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Handover version '{payload.handover_version_id}' not found.",
        )

    ack_id = f"ack-{current_user.id}-{uuid.uuid4().hex[:8]}"
    ack = Acknowledgement(
        id=ack_id,
        handover_version_id=hv.id,
        user_id=current_user.id,
        acknowledged_at=datetime.now(timezone.utc),
        note=payload.note or "",
    )
    db.merge(ack)

    audit = AuditLog(
        id=f"aud-ack-{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        action="ACKNOWLEDGE",
        target_type="handover",
        target_id=hv.id,
        details=f"User {current_user.id} acknowledged handover version {hv.version}.",
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "acknowledgement_id": ack_id,
        "user_id": current_user.id,
        "acknowledged_at": ack.acknowledged_at,
    }
