from datetime import datetime, timezone
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.db import get_db
from app.models import (
    HandoverPlan,
    PlanProgress,
    Claim,
    EvidenceUnit,
    HandoverVersion,
    User,
    AuditLog,
)
from app.schemas import (
    PlanGenerateRequest,
    PlanItemPatchRequest,
    PlanProgressPatchRequest,
    PlanPublishRequest,
    PlanResponse,
    PlanItem,
)
from app.security import get_current_user, require_lead
from app.services.plan import generate_plan_items
from app.services.share_check import run_share_check

router = APIRouter(prefix="/api/plan", tags=["Plan"])


def _hydrate_plan_response(
    plan: HandoverPlan,
    db: Session,
    viewer: User,
    claims: Optional[List[Claim]] = None,
) -> PlanResponse:
    """Helper to convert HandoverPlan model into PlanResponse with viewer clearance filtering."""
    # Check staleness: if any project claim was updated after plan was generated
    is_stale = False
    if claims:
        for c in claims:
            if c.updated_at and plan.generated_at and c.updated_at > plan.generated_at:
                is_stale = True
                break

    # Load progress for current viewer
    progress_map = {
        p.item_id: p.done
        for p in db.query(PlanProgress).filter(
            PlanProgress.plan_id == plan.id,
            PlanProgress.user_id == viewer.id,
        ).all()
    }

    # If viewer clearance is limited (e.g. Arjun level 1), filter out items citing restricted claims
    claims_lookup = {c.id: c for c in (claims or db.query(Claim).filter(Claim.project_id == plan.project_id).all())}
    visible_items: List[PlanItem] = []

    for item_data in (plan.items_json or []):
        cited_ids = item_data.get("claim_ids") or []
        # Check if any cited claim exceeds viewer clearance
        if any(
            claims_lookup.get(cid) and claims_lookup[cid].access_level > viewer.clearance
            for cid in cited_ids
        ):
            continue  # Excluded from response to prevent leak

        item_copy = dict(item_data)
        item_copy["done"] = progress_map.get(item_data.get("id"), False)
        visible_items.append(PlanItem(**item_copy))

    completed_count = sum(1 for it in visible_items if it.done)

    return PlanResponse(
        id=plan.id,
        project_id=plan.project_id,
        version_id=plan.version_id,
        status=plan.status,
        role_title=plan.role_title,
        focus_areas=plan.focus_areas or [],
        items=visible_items,
        is_stale=is_stale,
        generated_at=plan.generated_at,
        published_at=plan.published_at,
        completed_count=completed_count,
        total_items=len(visible_items),
    )


@router.post("/generate", response_model=PlanResponse)
def generate_plan(
    payload: PlanGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),
):
    """
    Generates a deterministic 7-day onboarding plan (Lead only).
    Uses candidate non-rejected claims and tailors based on role and focus areas.
    """
    # Gathers candidate non-rejected claims
    all_claims = (
        db.query(Claim)
        .filter(Claim.project_id == payload.project_id, Claim.review_state != "rejected")
        .all()
    )

    if not all_claims:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate plan: no eligible claims found in project.",
        )

    claims_dicts = [
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
        for c in all_claims
    ]

    role_title = payload.role_title or "Software Engineer"
    focus_areas = payload.focus_areas or ["Backend", "Vault", "Stripe", "APNs"]

    plan_items = generate_plan_items(
        claims=claims_dicts,
        role_title=role_title,
        focus_areas=focus_areas,
    )

    # Persist or update draft plan
    existing_plan = (
        db.query(HandoverPlan)
        .filter(
            HandoverPlan.project_id == payload.project_id,
            HandoverPlan.status == "draft",
        )
        .first()
    )

    # Preserve any items pinned in the existing draft plan during regeneration
    if existing_plan and existing_plan.items_json:
        pinned_items = [it for it in existing_plan.items_json if it.get("is_pinned")]
        if pinned_items:
            pinned_cids = {cid for it in pinned_items for cid in (it.get("claim_ids") or [])}
            # Retain generated items that don't collide with pinned claim IDs, then add pinned items
            merged_items = [
                it for it in plan_items
                if not any(cid in pinned_cids for cid in (it.get("claim_ids") or []))
            ]
            merged_items.extend(pinned_items)
            plan_items = merged_items

    now = datetime.now(timezone.utc)
    if not existing_plan:
        plan_id = f"plan-{payload.project_id}-{uuid.uuid4().hex[:8]}"
        plan_obj = HandoverPlan(
            id=plan_id,
            project_id=payload.project_id,
            version_id=None,
            status="draft",
            role_title=role_title,
            focus_areas=focus_areas,
            items_json=plan_items,
            generated_at=now,
            generated_by=current_user.id,
        )
        db.add(plan_obj)
    else:
        plan_obj = existing_plan
        plan_obj.role_title = role_title
        plan_obj.focus_areas = focus_areas
        plan_obj.items_json = plan_items
        plan_obj.generated_at = now
        plan_obj.generated_by = current_user.id

    audit = AuditLog(
        id=f"aud-genplan-{uuid.uuid4().hex[:12]}",
        actor=current_user.id,
        action="GENERATE_PLAN",
        entity="handover_plan",
        entity_id=plan_obj.id,
        details=f"Lead {current_user.id} generated {len(plan_items)} onboarding items for role '{role_title}'.",
    )
    db.add(audit)
    db.commit()
    db.refresh(plan_obj)

    return _hydrate_plan_response(plan_obj, db, current_user, all_claims)


@router.get("", response_model=PlanResponse)
def get_plan(
    project_id: str = "campusconnect",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the onboarding plan:
    - Lead (maya): gets the draft or latest published plan.
    - Successor (arjun): gets ONLY the published plan for the approved version, filtered by clearance.
    - Leaver (riya): gets read-only draft plan.
    """
    all_claims = db.query(Claim).filter(Claim.project_id == project_id).all()

    if current_user.role == "successor":
        # Successor only sees published plan
        published = (
            db.query(HandoverPlan)
            .filter(
                HandoverPlan.project_id == project_id,
                HandoverPlan.status == "published",
            )
            .order_by(HandoverPlan.published_at.desc())
            .first()
        )
        if not published:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No published onboarding plan found for successor.",
            )
        return _hydrate_plan_response(published, db, current_user, all_claims)

    # Lead or Leaver: look for draft first, then published
    plan = (
        db.query(HandoverPlan)
        .filter(
            HandoverPlan.project_id == project_id,
            HandoverPlan.status == "draft",
        )
        .first()
    )
    if not plan:
        plan = (
            db.query(HandoverPlan)
            .filter(
                HandoverPlan.project_id == project_id,
                HandoverPlan.status == "published",
            )
            .order_by(HandoverPlan.published_at.desc())
            .first()
        )

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No onboarding plan has been generated yet.",
        )

    return _hydrate_plan_response(plan, db, current_user, all_claims)


@router.patch("/items/{item_id}", response_model=PlanResponse)
def update_plan_item(
    item_id: str,
    payload: PlanItemPatchRequest,
    project_id: str = "campusconnect",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),
):
    """
    Updates, moves day, or pins an item in the draft plan (Lead only).
    Maintains claim citations intact.
    """
    plan = (
        db.query(HandoverPlan)
        .filter(HandoverPlan.project_id == project_id, HandoverPlan.status == "draft")
        .first()
    )
    if not plan:
        # Fall back to latest plan
        plan = db.query(HandoverPlan).filter(HandoverPlan.project_id == project_id).order_by(HandoverPlan.generated_at.desc()).first()
        if not plan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active plan found to edit.")

    items = list(plan.items_json or [])
    found = False
    for it in items:
        if it.get("id") == item_id:
            found = True
            if payload.day is not None:
                it["day"] = payload.day
            if payload.title is not None:
                it["title"] = payload.title
            if payload.why_it_matters is not None:
                it["why_it_matters"] = payload.why_it_matters
            if payload.category is not None:
                it["category"] = payload.category
            if payload.priority is not None:
                it["priority"] = payload.priority
            if payload.effort is not None:
                it["effort"] = payload.effort
            if payload.is_pinned is not None:
                it["is_pinned"] = payload.is_pinned
            break

    if not found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan item '{item_id}' not found.",
        )

    plan.items_json = items
    flag_modified(plan, "items_json")
    audit = AuditLog(
        id=f"aud-edititem-{uuid.uuid4().hex[:12]}",
        actor=current_user.id,
        action="EDIT_PLAN_ITEM",
        entity="handover_plan",
        entity_id=plan.id,
        details=f"Lead {current_user.id} updated item {item_id}.",
    )
    db.add(audit)
    db.commit()
    db.refresh(plan)

    all_claims = db.query(Claim).filter(Claim.project_id == project_id).all()
    return _hydrate_plan_response(plan, db, current_user, all_claims)


@router.delete("/items/{item_id}", response_model=PlanResponse)
def delete_plan_item(
    item_id: str,
    project_id: str = "campusconnect",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),
):
    """
    Removes an item from the draft plan (Lead only).
    """
    plan = (
        db.query(HandoverPlan)
        .filter(HandoverPlan.project_id == project_id, HandoverPlan.status == "draft")
        .first()
    )
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No draft plan found.")

    items = [it for it in (plan.items_json or []) if it.get("id") != item_id]
    if len(items) == len(plan.items_json or []):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Plan item '{item_id}' not found.")

    plan.items_json = items
    flag_modified(plan, "items_json")
    audit = AuditLog(
        id=f"aud-delitem-{uuid.uuid4().hex[:12]}",
        actor=current_user.id,
        action="REMOVE_PLAN_ITEM",
        entity="handover_plan",
        entity_id=plan.id,
        details=f"Lead {current_user.id} removed item {item_id}.",
    )
    db.add(audit)
    db.commit()
    db.refresh(plan)

    all_claims = db.query(Claim).filter(Claim.project_id == project_id).all()
    return _hydrate_plan_response(plan, db, current_user, all_claims)


@router.post("/publish", response_model=PlanResponse)
def publish_plan(
    payload: PlanPublishRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),
):
    """
    Publishes the draft plan to attach it to the latest approved handover version (Lead only).
    Blocks on Block-severity findings from share-check.
    Warn-severity findings require acknowledge_warnings=True.
    """
    hv = (
        db.query(HandoverVersion)
        .filter(HandoverVersion.project_id == payload.project_id)
        .order_by(HandoverVersion.approved_at.desc())
        .first()
    )
    if not hv:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot publish plan: Handover must be formally approved before publishing the onboarding plan.",
        )

    plan = (
        db.query(HandoverPlan)
        .filter(
            HandoverPlan.project_id == payload.project_id,
            HandoverPlan.status == "draft",
        )
        .first()
    )
    if not plan:
        # Check if already published
        plan = (
            db.query(HandoverPlan)
            .filter(
                HandoverPlan.project_id == payload.project_id,
                HandoverPlan.status == "published",
            )
            .first()
        )
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No plan exists to publish. Please generate a plan first.",
            )

    # Perform Share Check
    all_claims = db.query(Claim).filter(Claim.project_id == payload.project_id).all()
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
    ev_units = db.query(EvidenceUnit).filter(EvidenceUnit.project_id == payload.project_id).all()
    ev_map = {e.id: {"id": e.id, "access_level": e.access_level} for e in ev_units}

    can_publish, findings = run_share_check(
        claims=claims_dicts,
        plan_items=plan.items_json or [],
        evidence_lookup=ev_map,
        successor_clearance=1,
    )

    blockers = [f for f in findings if f["severity"] == "block"]
    if blockers:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Cannot publish plan: Block-severity confidentiality checks failed.",
                "blockers": blockers,
            },
        )

    warnings = [f for f in findings if f["severity"] == "warn"]
    if warnings and not payload.acknowledge_warnings:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Warnings detected in share check. Please review and acknowledge to publish.",
                "warnings": warnings,
            },
        )

    now = datetime.now(timezone.utc)
    plan.status = "published"
    plan.version_id = hv.id
    plan.published_at = now

    audit = AuditLog(
        id=f"aud-pubplan-{uuid.uuid4().hex[:12]}",
        actor=current_user.id,
        action="PUBLISH_PLAN",
        entity="handover_plan",
        entity_id=plan.id,
        details=f"Lead {current_user.id} published onboarding plan attached to {hv.id}.",
    )
    db.add(audit)
    db.commit()
    db.refresh(plan)

    return _hydrate_plan_response(plan, db, current_user, all_claims)


@router.patch("/items/{item_id}/progress")
def update_item_progress(
    item_id: str,
    payload: PlanProgressPatchRequest,
    project_id: str = "campusconnect",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Successor checklist toggle: records done status per user for a plan item.
    Idempotent.
    """
    plan = (
        db.query(HandoverPlan)
        .filter(
            HandoverPlan.project_id == project_id,
            HandoverPlan.status == "published",
        )
        .order_by(HandoverPlan.published_at.desc())
        .first()
    )
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No published plan found to track progress against.",
        )

    # Verify item exists in plan and is visible to current user's clearance
    items = plan.items_json or []
    target_item = next((it for it in items if it.get("id") == item_id), None)
    if not target_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item '{item_id}' not found in published plan.",
        )

    # Check cited claims clearance: hidden items return 404 to prevent discovery via guessing
    cited_ids = target_item.get("claim_ids") or []
    if cited_ids:
        claims_lookup = {
            c.id: c
            for c in db.query(Claim)
            .filter(Claim.project_id == project_id, Claim.id.in_(cited_ids))
            .all()
        }
        if any(
            claims_lookup.get(cid) and claims_lookup[cid].access_level > current_user.clearance
            for cid in cited_ids
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item '{item_id}' not found in published plan.",
            )

    prog_id = f"prog-{plan.id}-{item_id}-{current_user.id}"
    prog = db.query(PlanProgress).filter(PlanProgress.id == prog_id).first()

    now = datetime.now(timezone.utc)
    if not prog:
        prog = PlanProgress(
            id=prog_id,
            plan_id=plan.id,
            item_id=item_id,
            user_id=current_user.id,
            done=payload.done,
            at=now,
        )
        db.add(prog)
    else:
        prog.done = payload.done
        prog.at = now

    db.commit()

    return {
        "status": "success",
        "item_id": item_id,
        "done": payload.done,
        "user_id": current_user.id,
        "updated_at": now,
    }
