import time
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import EvidenceUnit, Claim, User, AuditLog, ExtractionRun
from app.schemas import ExtractRequest, ExtractResponse
from app.services.extract import extract_claims_from_units
from app.security import get_current_user, require_lead_or_leaver

router = APIRouter(prefix="/api/extract", tags=["Extraction"])


@router.post("", response_model=ExtractResponse)
def trigger_claim_extraction(
    payload: ExtractRequest = ExtractRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead_or_leaver),
):
    """
    Triggers structured claim extraction against available evidence units (lead or leaver only).
    Selects units with access_level <= caller's clearance in the DB query BEFORE any model call.
    Runs Gemini API when key is configured, or falls back gracefully to deterministic cache.
    Records an extraction_runs row so the UI can honestly display 'live model' vs 'demo cache'.
    Never crashes the request.
    """
    start_time = time.time()
    started_at = datetime.now(timezone.utc)

    # 1. Select evidence with clearance <= caller's clearance BEFORE any model call
    units = (
        db.query(EvidenceUnit)
        .filter(
            EvidenceUnit.project_id == payload.project_id,
            EvidenceUnit.access_level <= current_user.clearance,
        )
        .all()
    )

    raw_units = [
        {
            "id": u.id,
            "source_type": u.source_type,
            "source_ref": u.source_ref,
            "text": u.text,
            "access_level": u.access_level,
        }
        for u in units
    ]

    claims_data, origin = extract_claims_from_units(
        raw_units,
        use_cache=payload.use_cache,
        caller_clearance=current_user.clearance,
    )

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
            origin=c.get("origin", origin),
            conflict_group_id=c.get("conflict_group_id"),
        )
        db.merge(claim_obj)

    finished_at = datetime.now(timezone.utc)

    # Record extraction_runs row with origin
    run = ExtractionRun(
        id=f"run-{uuid.uuid4().hex[:12]}",
        origin=origin,
        started_at=started_at,
        finished_at=finished_at,
        counts_json={
            "extracted": len(claims_data),
            "verified": verified_count,
            "conflicting": conflicting_count,
            "inferred": inferred_count,
            "missing": missing_count,
        },
    )
    db.add(run)

    audit = AuditLog(
        id=f"aud-extract-{uuid.uuid4().hex[:12]}",
        actor=current_user.id,
        action="EXTRACT_CLAIMS",
        entity="project",
        entity_id=payload.project_id,
        details=f"Extracted {len(claims_data)} claims ({verified_count} verified, {conflicting_count} conflicting) via origin '{origin}'.",
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
        origin=origin,
    )
