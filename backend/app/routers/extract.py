import time
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import EvidenceUnit, Claim, User, AuditLog
from app.schemas import ExtractRequest, ExtractResponse
from app.services.extract import extract_claims_from_units
from app.security import get_current_user

router = APIRouter(prefix="/api/extract", tags=["Extraction"])


@router.post("", response_model=ExtractResponse)
def trigger_claim_extraction(
    payload: ExtractRequest = ExtractRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Triggers structured claim extraction against available evidence units,
    followed by deterministic quote verification.
    """
    start_time = time.time()
    
    units = (
        db.query(EvidenceUnit)
        .filter(EvidenceUnit.project_id == payload.project_id)
        .all()
    )
    raw_units = [
        {
            "id": u.id,
            "source_ref": u.source_ref,
            "text": u.text,
            "access_level": u.access_level,
        }
        for u in units
    ]

    claims_data = extract_claims_from_units(raw_units, use_cache=payload.use_cache)
    
    verified_count = 0
    conflicting_count = 0
    inferred_count = 0
    missing_count = 0

    for c in claims_data:
        status_val = c.get("status", "inferred")
        if status_val == "verified":
            verified_count += 1
        elif status_val == "conflicting":
            conflicting_count += 1
        elif status_val == "missing":
            missing_count += 1
        else:
            inferred_count += 1

        claim_obj = Claim(
            id=c["id"],
            project_id=payload.project_id,
            type=c["type"],
            text=c["text"],
            owner=c["owner"],
            status=status_val,
            evidence_ids=c["evidence_ids"],
            quote=c.get("quote", ""),
            access_level=c.get("access_level", 1),
            review_state=c.get("review_state", "draft"),
            version=c.get("version", 1),
            origin=c.get("origin", "llm"),
        )
        db.merge(claim_obj)
        
    audit = AuditLog(
        id=f"aud-extract-{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        action="EXTRACT_CLAIMS",
        target_type="project",
        target_id=payload.project_id,
        details=f"Extracted {len(claims_data)} claims ({verified_count} verified, {conflicting_count} conflicting).",
    )
    db.add(audit)
    db.commit()

    duration_ms = int((time.time() - start_time) * 1000)
    return ExtractResponse(
        status="completed",
        extracted_count=len(claims_data),
        verified_count=verified_count,
        conflicting_count=conflicting_count,
        inferred_count=inferred_count,
        missing_count=missing_count,
        duration_ms=duration_ms,
    )
