import os
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import EvidenceUnit, User, AuditLog
from app.security import get_current_user, require_lead_or_leaver
from app.services.ingest import parse_uploaded_source

router = APIRouter(prefix="/api/sources", tags=["Sources"])

MAX_UPLOAD_BYTES = 2 * 1024 * 1024  # 2 MB
ALLOWED_EXTENSIONS = {".json", ".csv", ".md", ".txt"}


@router.post("")
async def upload_source(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead_or_leaver),
):
    """
    Uploads a source file (max 2 MB; .json, .csv, .md, .txt).
    Runs deterministic PII and secret masking before persistence.
    """
    filename = file.filename or "upload.txt"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    content_bytes = await file.read()
    if len(content_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of 2 MB ({len(content_bytes)} bytes).",
        )

    try:
        content_text = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        content_text = content_bytes.decode("latin-1", errors="replace")

    parsed_units = parse_uploaded_source(filename, content_text, project_id="campusconnect")
    saved_count = 0
    for u in parsed_units:
        try:
            ts = datetime.fromisoformat(u["timestamp"].replace("Z", "+00:00"))
        except Exception:
            ts = datetime.now(timezone.utc)

        unit = EvidenceUnit(
            id=u["id"],
            project_id=u["project_id"],
            source_type=u["source_type"],
            source_ref=u["source_ref"],
            location=u["location"],
            author=u["author"],
            timestamp=ts,
            text=u["text"],
            access_level=u["access_level"],
            redactions_json=u.get("redactions_json", []),
        )
        db.merge(unit)
        saved_count += 1
    db.commit()

    audit = AuditLog(
        id=f"aud-{uuid.uuid4().hex[:12]}",
        actor=current_user.id,
        action="UPLOAD_SOURCE",
        entity="source",
        entity_id=filename,
        details=f"Uploaded source '{filename}', extracted {saved_count} evidence units.",
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "filename": filename,
        "units_extracted": saved_count,
        "message": f"Successfully ingested {saved_count} units with privacy masking applied.",
    }
