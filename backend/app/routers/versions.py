import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import HandoverVersion, Acknowledgement, AuditLog, Claim, User
from app.schemas import (
    VersionSummaryRead,
    VersionDetailRead,
    VersionDiffResponse,
    AcknowledgementTrackingResponse,
    ClaimRead,
)
from app.security import get_current_user, require_lead
from app.services.permissions import can_view_entity
from app.services.handover import partition_handover_sections, generate_first_7_days_plan
from app.services.versioning import (
    compute_version_diff,
    get_acknowledgement_tracking,
    sanitize_redact_value,
)

router = APIRouter(prefix="/api", tags=["Versions & Diff"])


@router.get("/versions", response_model=List[VersionSummaryRead])
def list_versions(
    project_id: str = "campusconnect",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lists all approved handover versions with metadata and status breakdowns.
    - Team lead (Maya): Full access to version summaries, counts, and ack summaries.
    - Leaver (Riya): Read-only metadata only.
    - Successor (Arjun): 403 Forbidden.
    """
    if current_user.role == "successor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: successors may not inspect version history.",
        )

    versions = (
        db.query(HandoverVersion)
        .filter(HandoverVersion.project_id == project_id)
        .order_by(HandoverVersion.approved_at.desc())
        .all()
    )

    if not versions:
        return []

    latest_id = versions[0].id
    results = []

    # Get tracking summary for current version
    ack_info = get_acknowledgement_tracking(db, project_id=project_id)
    total_recipients = ack_info.get("total_recipients", 0)

    for v in versions:
        is_curr = (v.id == latest_id)

        # Count claims by status
        raw_claims = v.snapshot_json or []
        visible_claims = [
            c for c in raw_claims
            if isinstance(c, dict) and can_view_entity(c.get("access_level", 1), current_user.clearance)
        ]

        if current_user.role == "lead":
            status_counts: Dict[str, int] = {}
            for c in visible_claims:
                st = c.get("status", "inferred")
                status_counts[st] = status_counts.get(st, 0) + 1

            # Acknowledgement summary
            acks_for_v = (
                db.query(Acknowledgement)
                .filter(
                    (Acknowledgement.version_id == v.id)
                    | (Acknowledgement.version_id == f"hv-v{v.version}")
                )
                .count()
            )
            ack_summary = f"{acks_for_v} of {total_recipients} acknowledged"

            results.append(
                VersionSummaryRead(
                    id=v.id,
                    version=v.version,
                    approved_by=v.approved_by,
                    approved_at=v.approved_at,
                    notes=v.notes or "",
                    claims_count=len(visible_claims),
                    status_counts=status_counts,
                    is_current=is_curr,
                    acknowledgement_summary=ack_summary,
                )
            )
        else:
            # Leaver (Riya) gets metadata only
            results.append(
                VersionSummaryRead(
                    id=v.id,
                    version=v.version,
                    approved_by=v.approved_by,
                    approved_at=v.approved_at,
                    notes=v.notes or "",
                    claims_count=0,
                    status_counts={},
                    is_current=is_curr,
                    acknowledgement_summary="Protected",
                )
            )

    return results


@router.get("/versions/diff", response_model=VersionDiffResponse)
def get_version_diff(
    from_version: Optional[str] = Query(None, alias="from"),
    to_version: Optional[str] = Query(None, alias="to"),
    project_id: str = "campusconnect",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),  # Lead only!
):
    """
    Computes a field-level semantic diff between two handover snapshots (lead only).
    Defaults to previous vs latest version if unassigned.
    """
    all_versions = (
        db.query(HandoverVersion)
        .filter(HandoverVersion.project_id == project_id)
        .order_by(HandoverVersion.approved_at.asc())
        .all()
    )

    if not all_versions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No approved handover versions exist to compare.",
        )

    # Resolve to_version (default: latest)
    if to_version:
        v_to = next((v for v in all_versions if v.version == to_version or v.id == to_version or v.id == f"hv-v{to_version}"), None)
        if not v_to:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target version '{to_version}' not found.",
            )
    else:
        v_to = all_versions[-1]

    # Resolve from_version (default: previous to v_to, or v_to if only 1 version)
    if from_version:
        v_from = next((v for v in all_versions if v.version == from_version or v.id == from_version or v.id == f"hv-v{from_version}"), None)
        if not v_from:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Source version '{from_version}' not found.",
            )
    else:
        idx = all_versions.index(v_to)
        v_from = all_versions[idx - 1] if idx > 0 else v_to

    diff_data = compute_version_diff(
        version_a=v_from,
        version_b=v_to,
        db=db,
        viewer_clearance=current_user.clearance,
    )
    return diff_data


@router.get("/versions/{version_str}", response_model=VersionDetailRead)
def get_version_detail(
    version_str: str,
    project_id: str = "campusconnect",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),  # Lead only!
):
    """
    Returns a read-only frozen snapshot of a specific handover version,
    grouped by sections, filtered strictly by viewer clearance.
    """
    hv = (
        db.query(HandoverVersion)
        .filter(
            HandoverVersion.project_id == project_id,
            (HandoverVersion.version == version_str)
            | (HandoverVersion.id == version_str)
            | (HandoverVersion.id == f"hv-v{version_str}"),
        )
        .first()
    )

    if not hv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Handover version '{version_str}' not found.",
        )

    # Check if latest
    latest_hv = (
        db.query(HandoverVersion)
        .filter(HandoverVersion.project_id == project_id)
        .order_by(HandoverVersion.approved_at.desc())
        .first()
    )
    is_current = bool(latest_hv and latest_hv.id == hv.id)

    raw_claims = hv.snapshot_json or []
    visible_claims_raw = []
    hidden_count = 0

    for c in raw_claims:
        if isinstance(c, dict):
            lvl = c.get("access_level", 1)
            if can_view_entity(lvl, current_user.clearance):
                visible_claims_raw.append(sanitize_redact_value(c, current_user.clearance))
            else:
                hidden_count += 1

    sections_raw = partition_handover_sections(visible_claims_raw)
    sections_read = {
        sec_name: [ClaimRead(**c) for c in c_list]
        for sec_name, c_list in sections_raw.items()
    }
    first_7_days = generate_first_7_days_plan(visible_claims_raw)
    claims_read = [ClaimRead(**c) for c in visible_claims_raw]

    return VersionDetailRead(
        id=hv.id,
        version=hv.version,
        project_id=hv.project_id,
        approved_by=hv.approved_by,
        approved_at=hv.approved_at,
        notes=hv.notes or "",
        viewer_clearance=current_user.clearance,
        claims=claims_read,
        sections=sections_read,
        first_7_days=first_7_days,
        hidden_count=hidden_count,
        is_current=is_current,
    )


@router.get("/acknowledgements", response_model=AcknowledgementTrackingResponse)
def get_acknowledgements(
    version: Optional[str] = None,
    project_id: str = "campusconnect",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),  # Lead only!
):
    """
    Returns receipt acknowledgement tracking across all successors for a version (lead only).
    Identifies Acknowledged, Pending, and Outdated statuses.
    """
    tracking = get_acknowledgement_tracking(
        db=db,
        project_id=project_id,
        version_query=version,
    )
    return tracking


@router.post("/demo/seed-history")
def seed_version_history_demo(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),  # Lead only!
):
    """
    Demo helper: Seeds an initial Version 1.0.0 and subsequent Version 1.1.0,
    along with Arjun's acknowledgement of Version 1.0.0.
    This creates an immediate, plausible diff and 'Outdated' acknowledgement state for judges.
    """
    project_id = "campusconnect"
    now = datetime.now(timezone.utc)
    t_v1 = now - timedelta(days=2)
    t_ack1 = now - timedelta(days=1, hours=18)
    t_v2 = now - timedelta(hours=3)

    # 1. Fetch current eligible claims for V1 base
    claims = db.query(Claim).filter(Claim.project_id == project_id).all()
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot seed history: No claims found. Please load demo data first via POST /api/demo/load.",
        )

    # Snapshot for V1.0.0 (simulating pre-resolution state of clm-004)
    v1_claims_snapshot = []
    for c in claims:
        claim_dict = {
            "id": c.id,
            "project_id": c.project_id,
            "type": c.type,
            "text": "Payment provider API key must be rotated monthly every 30 days per PCI requirement." if c.id == "clm-004" else c.text,
            "owner": "Riya Sharma" if c.id == "clm-004" else c.owner,
            "status": "conflicting" if c.id == "clm-004" else c.status,
            "evidence_ids": c.evidence_ids or [],
            "quote": c.quote,
            "access_level": c.access_level,
            "review_state": "draft" if c.id == "clm-004" else c.review_state,
            "version": 1,
            "origin": c.origin,
            "conflict_group_id": c.conflict_group_id,
        }
        v1_claims_snapshot.append(claim_dict)

    # Snapshot for V1.1.0 (after Maya resolved clm-004 and updated rotation to quarterly)
    v2_claims_snapshot = []
    for c in claims:
        claim_dict = {
            "id": c.id,
            "project_id": c.project_id,
            "type": c.type,
            "text": "External API keys rotate quarterly (90 days) per infrastructure alignment." if c.id == "clm-004" else c.text,
            "owner": "Arjun Rao" if c.id == "clm-004" else c.owner,
            "status": "verified" if c.id == "clm-004" else c.status,
            "evidence_ids": c.evidence_ids or [],
            "quote": c.quote,
            "access_level": c.access_level,
            "review_state": "confirmed" if c.id == "clm-004" else c.review_state,
            "version": 2 if c.id == "clm-004" else c.version,
            "origin": "human" if c.id == "clm-004" else c.origin,
            "conflict_group_id": None if c.id == "clm-004" else c.conflict_group_id,
        }
        v2_claims_snapshot.append(claim_dict)

    # Clean existing versions & acknowledgements
    db.query(Acknowledgement).delete()
    db.query(HandoverVersion).delete()
    db.commit()

    # Create Version 1.0.0
    hv1 = HandoverVersion(
        id="hv-v1.0.0",
        project_id=project_id,
        version="1.0.0",
        snapshot_json=v1_claims_snapshot,
        approved_by="maya",
        approved_at=t_v1,
        notes="Initial baseline handover ratified for engineering transition.",
    )
    db.add(hv1)

    # Create Version 1.1.0
    hv2 = HandoverVersion(
        id="hv-v1.1.0",
        project_id=project_id,
        version="1.1.0",
        snapshot_json=v2_claims_snapshot,
        approved_by="maya",
        approved_at=t_v2,
        notes="Updated PCI rotation frequency to quarterly and reassigned key ownership to Arjun.",
    )
    db.add(hv2)

    # Seed Arjun's acknowledgement on Version 1.0.0 (making him Outdated for 1.1.0)
    ack = Acknowledgement(
        id=f"ack-arjun-{hv1.id}",
        version_id=hv1.id,
        user_id="arjun",
        at=t_ack1,
        note="Initial receipt confirmed; reviewed backend components.",
    )
    db.add(ack)

    # Seed audit trail for the edits
    aud_v1 = AuditLog(
        id=f"aud-seed-v1-{uuid.uuid4().hex[:8]}",
        actor="maya",
        action="APPROVE_HANDOVER",
        entity="handover",
        entity_id=hv1.id,
        after_json={"note": hv1.notes, "version": "1.0.0"},
        at=t_v1,
        details="Lead maya approved initial handover version 1.0.0.",
    )
    aud_ack = AuditLog(
        id=f"aud-seed-ack-{uuid.uuid4().hex[:8]}",
        actor="arjun",
        action="ACKNOWLEDGE",
        entity="handover",
        entity_id=hv1.id,
        after_json={"note": ack.note},
        at=t_ack1,
        details="Successor arjun acknowledged receipt of handover version 1.0.0.",
    )
    aud_edit = AuditLog(
        id=f"aud-seed-edit-{uuid.uuid4().hex[:8]}",
        actor="maya",
        action="REVIEW_CLAIM",
        entity="claim",
        entity_id="clm-004",
        before_json={"owner": "Riya Sharma", "review_state": "draft"},
        after_json={
            "owner": "Arjun Rao",
            "review_state": "confirmed",
            "version": 2,
            "note": "Updated rotation frequency to 90 days and transferred ownership to Arjun per PCI meeting agreement.",
        },
        at=t_v2 - timedelta(minutes=15),
        details="Lead maya confirmed claim clm-004 and updated ownership.",
    )
    aud_v2 = AuditLog(
        id=f"aud-seed-v2-{uuid.uuid4().hex[:8]}",
        actor="maya",
        action="APPROVE_HANDOVER",
        entity="handover",
        entity_id=hv2.id,
        after_json={"note": hv2.notes, "version": "1.1.0"},
        at=t_v2,
        details="Lead maya approved updated handover version 1.1.0.",
    )

    db.add(aud_v1)
    db.add(aud_ack)
    db.add(aud_edit)
    db.add(aud_v2)
    db.commit()

    return {
        "status": "success",
        "message": "Demo history successfully seeded with versions 1.0.0 and 1.1.0 and outdated acknowledgement.",
        "versions": ["1.0.0", "1.1.0"],
        "outdated_recipient": "arjun",
    }
