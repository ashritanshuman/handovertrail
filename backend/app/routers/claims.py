import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Claim, EvidenceUnit, User, AuditLog
from app.schemas import ClaimRead, ClaimDetail, ClaimPatchRequest, EvidenceUnitRead, ConflictDetail
from app.security import get_current_user, require_lead

router = APIRouter(prefix="/api/claims", tags=["Claims"])


@router.get("", response_model=List[ClaimRead])
def list_claims(
    type: Optional[str] = Query(None, description="Filter by claim type"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (verified, inferred, conflicting, missing)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lists claims filtered by type, status, and viewer's clearance level.
    """
    query = db.query(Claim).filter(Claim.access_level <= current_user.clearance)
    
    if type:
        query = query.filter(Claim.type == type.lower())
    if status_filter:
        query = query.filter(Claim.status == status_filter.lower())
        
    claims = query.order_by(Claim.id.asc()).all()
    results = []
    for c in claims:
        conflict_details = None
        if c.status == "conflicting":
            conflict_details = ConflictDetail(
                statement_a="Issue #42: The payment provider API key must be rotated monthly every 30 days per PCI requirement.",
                statement_b="Architecture Meeting 2026-09-15: We agreed to rotate external API keys quarterly (90 days) to avoid breaking webhook integrations."
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
    Returns single claim detail with supporting evidence units.
    Enforces clearance check.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim '{claim_id}' not found.",
        )
        
    if claim.access_level > current_user.clearance:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Claim access level exceeds your clearance.",
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
        conflict_details = ConflictDetail(
            statement_a="Issue #42: The payment provider API key must be rotated monthly every 30 days per PCI requirement.",
            statement_b="Architecture Meeting 2026-09-15: We agreed to rotate external API keys quarterly (90 days) to avoid breaking webhook integrations."
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
    Updates, edits, or confirms a claim. Requires Lead role (e.g. Maya).
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim '{claim_id}' not found.",
        )

    if payload.text is not None:
        claim.text = payload.text
        claim.review_state = "edited"
    if payload.quote is not None:
        claim.quote = payload.quote
    if payload.owner is not None:
        claim.owner = payload.owner
    if payload.type is not None:
        claim.type = payload.type
    if payload.review_state:
        claim.review_state = payload.review_state
        if payload.review_state == "confirmed" and claim.status == "conflicting":
            claim.status = "verified"

    claim.version += 1
    
    audit = AuditLog(
        id=f"aud-patch-{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        action="REVIEW_CLAIM",
        target_type="claim",
        target_id=claim_id,
        details=f"Lead {current_user.id} updated claim to state '{claim.review_state}' (version {claim.version}).",
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
