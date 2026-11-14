from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import (
    HandoverVersion,
    HandoverPlan,
    PlanProgress,
    Claim,
    EvidenceUnit,
    User,
)
from app.schemas import (
    PreviewResponse,
    ShareCheckResponse,
    ShareCheckFinding,
    HiddenItemDetail,
    HandoverVersionRead,
    ClaimRead,
    PlanResponse,
    UserRead,
)
from app.security import require_lead, SEEDED_USERS
from app.services.handover import build_handover_view
from app.services.share_check import run_share_check

router = APIRouter(prefix="/api/preview", tags=["Preview"])


@router.get("", response_model=PreviewResponse)
def get_successor_preview(
    mode: str = Query("draft", pattern="^(draft|approved)$"),
    project_id: str = "campusconnect",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),  # Lead only!
):
    """
    Lead-only preview-as-successor endpoint.
    Simulates EXACTLY what Arjun Rao (Clearance 1) will see by executing the identical
    clearance-filtering and handover partitioning pipeline.
    Includes the 'Hidden from successor' panel detailing Level 2 items and Level 3 counts.
    """
    target_seed = SEEDED_USERS["arjun"]
    target_user = UserRead(
        id=target_seed["id"],
        name=target_seed["name"],
        role=target_seed["role"],
        clearance=target_seed["clearance"],
        email=target_seed["email"],
    )

    raw_claims: List[Dict[str, Any]] = []
    version_str = "1.0.0"
    approved_by = None
    approved_at = None
    notes = None
    handover_state = "draft"

    if mode == "approved":
        hv = (
            db.query(HandoverVersion)
            .filter(HandoverVersion.project_id == project_id)
            .order_by(HandoverVersion.approved_at.desc())
            .first()
        )
        if hv:
            raw_claims = hv.snapshot_json or []
            version_str = hv.version
            approved_by = hv.approved_by
            approved_at = hv.approved_at
            notes = hv.notes
            handover_state = "approved"
        else:
            # Not approved yet
            handover_state = "not_approved"
            raw_claims = []
    else:
        # Draft mode: previewing current active non-rejected claims
        handover_state = "draft"
        active_claims = (
            db.query(Claim)
            .filter(Claim.project_id == project_id, Claim.review_state != "rejected")
            .all()
        )
        raw_claims = [
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
            for c in active_claims
        ]
        version_str = "Draft (Unapproved)"

    # Load onboarding plan
    plan_record = None
    if mode == "approved":
        plan_record = (
            db.query(HandoverPlan)
            .filter(HandoverPlan.project_id == project_id, HandoverPlan.status == "published")
            .order_by(HandoverPlan.published_at.desc())
            .first()
        )
    else:
        # In draft mode, preview the draft plan or latest generated plan
        plan_record = (
            db.query(HandoverPlan)
            .filter(HandoverPlan.project_id == project_id, HandoverPlan.status == "draft")
            .first()
        )
        if not plan_record:
            plan_record = (
                db.query(HandoverPlan)
                .filter(HandoverPlan.project_id == project_id)
                .order_by(HandoverPlan.generated_at.desc())
                .first()
            )

    plan_dict = None
    if plan_record:
        # Hydrate progress simulated for target user arjun
        progress_map = {
            p.item_id: p.done
            for p in db.query(PlanProgress).filter(
                PlanProgress.plan_id == plan_record.id,
                PlanProgress.user_id == target_user.id,
            ).all()
        }
        items_with_progress = []
        for it in (plan_record.items_json or []):
            it_copy = dict(it)
            it_copy["done"] = progress_map.get(it["id"], False)
            items_with_progress.append(it_copy)

        plan_dict = {
            "id": plan_record.id,
            "project_id": plan_record.project_id,
            "version_id": plan_record.version_id,
            "status": plan_record.status,
            "role_title": plan_record.role_title,
            "focus_areas": plan_record.focus_areas or [],
            "items": items_with_progress,
            "is_stale": False,
            "generated_at": plan_record.generated_at,
            "published_at": plan_record.published_at,
            "completed_count": sum(1 for it in items_with_progress if it["done"]),
            "total_items": len(items_with_progress),
        }

    # Execute the EXACT same render & filter pipeline with target_user clearance (1)
    rendered = build_handover_view(
        raw_claims=raw_claims,
        viewer_clearance=target_user.clearance,  # 1
        plan_obj=plan_dict,
    )

    visible_claims = [ClaimRead(**c) for c in rendered["visible_claims_raw"]]
    sections_read = {
        sec_name: [ClaimRead(**c) for c in c_list]
        for sec_name, c_list in rendered["sections_raw"].items()
    }
    plan_response = PlanResponse(**rendered["plan"]) if rendered["plan"] else None

    handover_read = HandoverVersionRead(
        state=handover_state,
        version=version_str,
        project_id=project_id,
        approved_by=approved_by,
        approved_at=approved_at,
        notes=notes,
        viewer_clearance=target_user.clearance,
        claims=visible_claims,
        sections=sections_read,
        first_7_days=rendered["first_7_days"],
        plan=plan_response,
        hidden_count=rendered["hidden_count"],
        acknowledged=False,
    )

    hidden_items_out = [
        HiddenItemDetail(
            id=item["id"],
            type=item["type"],
            title=item["title"],
            access_level=item["access_level"],
            reason=item["reason"],
        )
        for item in rendered["hidden_level_2"]
    ]

    # Precompute share check findings for the preview view
    ev_units = db.query(EvidenceUnit).filter(EvidenceUnit.project_id == project_id).all()
    ev_map = {e.id: {"id": e.id, "access_level": e.access_level} for e in ev_units}
    can_publish, raw_findings = run_share_check(
        claims=raw_claims,
        plan_items=plan_record.items_json if plan_record else [],
        evidence_lookup=ev_map,
        successor_clearance=target_user.clearance,
    )
    share_check_resp = ShareCheckResponse(
        can_publish=can_publish,
        block_count=sum(1 for f in raw_findings if f["severity"] == "block"),
        warn_count=sum(1 for f in raw_findings if f["severity"] == "warn"),
        info_count=sum(1 for f in raw_findings if f["severity"] == "info"),
        findings=[ShareCheckFinding(**f) for f in raw_findings],
    )

    return PreviewResponse(
        mode=mode,
        target_user=target_user,
        handover=handover_read,
        hidden_items=hidden_items_out,
        confidential_count=rendered["confidential_count"],
        share_check=share_check_resp,
    )


@router.get("/check", response_model=ShareCheckResponse)
def get_share_check(
    project_id: str = "campusconnect",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),
):
    """
    Runs pre-publish confidentiality and safety audit across candidate handover claims and plan items (Lead only).
    """
    all_claims = (
        db.query(Claim)
        .filter(Claim.project_id == project_id, Claim.review_state != "rejected")
        .all()
    )
    claims_dicts = [
        {
            "id": c.id,
            "project_id": c.project_id,
            "type": c.type,
            "text": c.text,
            "quote": c.quote,
            "status": c.status,
            "access_level": c.access_level,
            "evidence_ids": c.evidence_ids or [],
        }
        for c in all_claims
    ]

    plan = (
        db.query(HandoverPlan)
        .filter(HandoverPlan.project_id == project_id)
        .order_by(HandoverPlan.generated_at.desc())
        .first()
    )
    plan_items = plan.items_json if plan else []

    ev_units = db.query(EvidenceUnit).filter(EvidenceUnit.project_id == project_id).all()
    ev_map = {e.id: {"id": e.id, "access_level": e.access_level} for e in ev_units}

    can_publish, findings = run_share_check(
        claims=claims_dicts,
        plan_items=plan_items,
        evidence_lookup=ev_map,
        successor_clearance=1,
    )

    return ShareCheckResponse(
        can_publish=can_publish,
        block_count=sum(1 for f in findings if f["severity"] == "block"),
        warn_count=sum(1 for f in findings if f["severity"] == "warn"),
        info_count=sum(1 for f in findings if f["severity"] == "info"),
        findings=[ShareCheckFinding(**f) for f in findings],
    )
