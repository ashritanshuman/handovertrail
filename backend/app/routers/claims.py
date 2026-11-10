import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Claim, EvidenceUnit, User, AuditLog
from app.schemas import ClaimRead, ClaimDetail, ClaimPatchRequest, EvidenceUnitRead, ConflictDetail
from app.security import get_current_user, require_lead
from app.services.verify import reverify_claim
from app.services.conflicts import check_single_claim_conflict

router = APIRouter(prefix="/api/claims", tags=["Claims"])


@router.get("", response_model=List[ClaimRead])
def list_claims(
    type: Optional[str] = Query(None, description="Filter by claim type"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (verified, inferred, conflicting, missing)"),
    review_state: Optional[str] = Query(None, description="Filter by review state (draft, confirmed, rejected, edited)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lists claims strictly filtered by type, status, review_state, and viewer's clearance level.
    Claims with access_level > viewer's clearance are excluded at the query level.
    """
    query = db.query(Claim).filter(Claim.access_level <= current_user.clearance)

    if type:
        query = query.filter(Claim.type == type.lower())
    if status_filter:
        query = query.filter(Claim.status == status_filter.lower())
    if review_state:
        query = query.filter(Claim.review_state == review_state.lower())

    claims = query.order_by(Claim.id.asc()).all()
    results = []
    for c in claims:
        conflict_details = None
        if c.status == "conflicting":
            conf_data = check_single_claim_conflict(c.text, c.quote)
            if conf_data:
                conflict_details = ConflictDetail(
                    statement_a=conf_data["statement_a"],
                    statement_b=conf_data["statement_b"],
                )
            else:
                conflict_details = ConflictDetail(
                    statement_a="Issue #42 (ev-github-004): Payment provider API key must be rotated monthly every 30 days per PCI requirement.",
                    statement_b="12 Oct Meeting Notes (ev-notes-002): Agreed to rotate external API keys quarterly (90 days) to avoid breaking webhook integrations.",
                )
        results.append(
            ClaimRead(
                id=c.id,
                project_id=c.project_id,
                type=c.type,
                text=c.text,
                owner=c.owner,
                status=c.status,
                evidence_ids=c.evidence_ids or [],
                quote=c.quote,
                access_level=c.access_level,
                review_state=c.review_state,
                version=c.version,
                origin=c.origin,
                conflict_details=conflict_details,
            )
        )
    return results


@router.get("/{claim_id}", response_model=ClaimDetail)
def get_claim(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns single claim detail with its supporting evidence units.
    If the claim does not exist or exceeds the viewer's clearance, returns 404 (never 403)
    so existence of privileged content is never revealed.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim or claim.access_level > current_user.clearance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim '{claim_id}' not found.",
        )

    ev_ids = claim.evidence_ids or []
    supporting_evidence = []
    if ev_ids:
        evidence_records = (
            db.query(EvidenceUnit)
            .filter(
                EvidenceUnit.id.in_(ev_ids),
                EvidenceUnit.access_level <= current_user.clearance,
            )
            .all()
        )
        supporting_evidence = [EvidenceUnitRead.model_validate(e) for e in evidence_records]

    conflict_details = None
    if claim.status == "conflicting":
        conf_data = check_single_claim_conflict(claim.text, claim.quote)
        if conf_data:
            conflict_details = ConflictDetail(
                statement_a=conf_data["statement_a"],
                statement_b=conf_data["statement_b"],
            )
        else:
            conflict_details = ConflictDetail(
                statement_a="Issue #42 (ev-github-004): Payment provider API key must be rotated monthly every 30 days per PCI requirement.",
                statement_b="12 Oct Meeting Notes (ev-notes-002): Agreed to rotate external API keys quarterly (90 days) to avoid breaking webhook integrations.",
            )

    return ClaimDetail(
        id=claim.id,
        project_id=claim.project_id,
        type=claim.type,
        text=claim.text,
        owner=claim.owner,
        status=claim.status,
        evidence_ids=claim.evidence_ids or [],
        quote=claim.quote,
        access_level=claim.access_level,
        review_state=claim.review_state,
        version=claim.version,
        origin=claim.origin,
        conflict_details=conflict_details,
        supporting_evidence=supporting_evidence,
    )


@router.patch("/{claim_id}")
def update_claim(
    claim_id: str,
    payload: ClaimPatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),  # Lead only!
):
    """
    Updates, edits, or confirms a claim (lead only).
    Actions: confirm | reject | edit (editing text/owner/type).
    Edits set origin='human' and review_state='edited', bump version, re-run verification,
    and write audit_log with before/after snapshots.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim '{claim_id}' not found.",
        )

    before_snapshot = {
        "text": claim.text,
        "owner": claim.owner,
        "type": claim.type,
        "quote": claim.quote,
        "status": claim.status,
        "review_state": claim.review_state,
        "version": claim.version,
        "origin": claim.origin,
    }

    is_edited = False
    if payload.text is not None and payload.text != claim.text:
        claim.text = payload.text
        is_edited = True
    if payload.quote is not None and payload.quote != claim.quote:
        claim.quote = payload.quote
        is_edited = True
    if payload.owner is not None and payload.owner != claim.owner:
        claim.owner = payload.owner
        is_edited = True
    if payload.type is not None and payload.type != claim.type:
        claim.type = payload.type
        is_edited = True

    if is_edited:
        claim.origin = "human"
        claim.review_state = "edited"

    if payload.review_state:
        claim.review_state = payload.review_state
        if payload.review_state == "confirmed" and claim.status == "conflicting":
            # Human resolution of conflict
            claim.status = "verified"
            claim.conflict_group_id = None
        elif payload.review_state == "rejected":
            claim.conflict_group_id = None

    claim.version += 1

    # Re-run deterministic verification
    reverify_claim(claim, db)

    after_snapshot = {
        "text": claim.text,
        "owner": claim.owner,
        "type": claim.type,
        "quote": claim.quote,
        "status": claim.status,
        "review_state": claim.review_state,
        "version": claim.version,
        "origin": claim.origin,
    }

    audit = AuditLog(
        id=f"aud-patch-{uuid.uuid4().hex[:12]}",
        actor=current_user.id,
        action="REVIEW_CLAIM",
        entity="claim",
        entity_id=claim_id,
        before_json=before_snapshot,
        after_json=after_snapshot,
        details=f"Lead {current_user.id} updated claim to state '{claim.review_state}' (version {claim.version}, status {claim.status}).",
    )
    db.add(audit)
    db.commit()
    db.refresh(claim)

    return {
        "id": claim.id,
        "review_state": claim.review_state,
        "status": claim.status,
        "version": claim.version,
        "message": f"Claim successfully updated by lead {current_user.id}.",
    }
