import os
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import EvidenceUnit, User, AuditLog
from app.schemas import EvidenceUnitRead
from app.security import get_current_user, require_lead_or_leaver
from app.services.ingest import parse_uploaded_source

router = APIRouter(prefix="/api/evidence", tags=["Evidence"])


@router.get("", response_model=List[EvidenceUnitRead])
def list_evidence(
    source_type: Optional[str] = Query(None, description="Filter by source type (github, jira, meeting_notes, slack)"),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns ingested evidence units strictly filtered by the viewer's clearance level.
    Filter is applied at the database query level so unauthorized units are never loaded.
    """
    query = db.query(EvidenceUnit).filter(
        EvidenceUnit.access_level <= current_user.clearance
    )
    if source_type:
        query = query.filter(EvidenceUnit.source_type == source_type.lower())

    units = query.order_by(EvidenceUnit.timestamp.asc()).limit(limit).all()
    return units


@router.get("/{evidence_id}", response_model=EvidenceUnitRead)
def get_evidence_unit(
    evidence_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns a single evidence unit by ID.
    If unit does not exist or its access level exceeds viewer's clearance, returns 404 (never 403)
    to prevent revealing the existence of privileged records.
    """
    unit = db.query(EvidenceUnit).filter(EvidenceUnit.id == evidence_id).first()
    if not unit or unit.access_level > current_user.clearance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence unit '{evidence_id}' not found.",
        )
    return unit
