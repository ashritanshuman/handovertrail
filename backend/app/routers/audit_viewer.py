from datetime import datetime
from typing import List, Optional, Union, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.db import get_db
from app.models import AuditLog, User
from app.schemas import AuditLogDetailRead, AuditPageResponse, AuditLogRead
from app.security import require_lead
from app.services.versioning import (
    sanitize_redact_value,
    generate_audit_summary,
    export_audit_csv_generator,
)

router = APIRouter(prefix="/api/audit", tags=["Audit Viewer & Export"])


@router.get("", response_model=Union[AuditPageResponse, List[AuditLogDetailRead]])
def list_audit_trail_viewer(
    actor: Optional[str] = None,
    action: Optional[str] = None,
    entity: Optional[str] = None,
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    q: Optional[str] = None,
    limit: int = Query(100, ge=1, le=200),
    cursor: Optional[str] = None,
    paginated: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),  # Lead only!
):
    """
    Returns an immutable audit log of all system mutations and sign-offs (lead only).
    Supports multi-field filtering, free-text search, redaction, and cursor-based pagination.
    Backward compatible: returns List[AuditLogDetailRead] unless paginated=True is requested.
    """
    query = db.query(AuditLog)

    # Actor filter
    if actor and actor.strip():
        query = query.filter(AuditLog.actor == actor.strip().lower())

    # Action filter
    if action and action.strip():
        query = query.filter(AuditLog.action == action.strip())

    # Entity filter
    if entity and entity.strip():
        query = query.filter(AuditLog.entity == entity.strip().lower())

    # Date range filters
    if from_date and from_date.strip():
        try:
            dt_from = datetime.fromisoformat(from_date.replace("Z", "+00:00"))
            query = query.filter(AuditLog.at >= dt_from)
        except Exception:
            pass

    if to_date and to_date.strip():
        try:
            dt_to = datetime.fromisoformat(to_date.replace("Z", "+00:00"))
            query = query.filter(AuditLog.at <= dt_to)
        except Exception:
            pass

    # Free-text search
    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                AuditLog.details.ilike(term),
                AuditLog.entity_id.ilike(term),
                AuditLog.actor.ilike(term),
                AuditLog.action.ilike(term),
                AuditLog.entity.ilike(term),
            )
        )

    # Total count before cursor
    total_count = query.count()

    # Cursor filter (for forward pagination on timestamp)
    if cursor and cursor.strip():
        try:
            cursor_dt = datetime.fromisoformat(cursor.replace("Z", "+00:00"))
            query = query.filter(AuditLog.at < cursor_dt)
        except Exception:
            pass

    # Order newest first
    query = query.order_by(AuditLog.at.desc())

    # Fetch rows (+1 to determine has_more)
    rows = query.limit(limit + 1).all()

    has_more = len(rows) > limit
    page_rows = rows[:limit]

    next_cursor = None
    if has_more and page_rows:
        next_cursor = page_rows[-1].at.isoformat()

    items: List[AuditLogDetailRead] = []
    for r in page_rows:
        sanitized_before = sanitize_redact_value(r.before_json, current_user.clearance)
        sanitized_after = sanitize_redact_value(r.after_json, current_user.clearance)
        sanitized_details = sanitize_redact_value(r.details, current_user.clearance)

        summary = generate_audit_summary(
            action=r.action,
            entity=r.entity,
            entity_id=r.entity_id,
            actor=r.actor,
            before_json=sanitized_before,
            after_json=sanitized_after,
            details=sanitized_details,
        )

        items.append(
            AuditLogDetailRead(
                id=r.id,
                user_id=r.actor,
                action=r.action,
                target_type=r.entity,
                target_id=r.entity_id,
                timestamp=r.at,
                details=sanitized_details,
                actor=r.actor,
                entity=r.entity,
                entity_id=r.entity_id,
                before_json=sanitized_before,
                after_json=sanitized_after,
                summary=summary,
            )
        )

    if paginated:
        return AuditPageResponse(
            items=items,
            total=total_count,
            limit=limit,
            cursor=next_cursor,
            has_more=has_more,
        )

    return items


@router.get("/export")
def export_audit_log_csv(
    format: str = Query("csv"),
    actor: Optional[str] = None,
    action: Optional[str] = None,
    entity: Optional[str] = None,
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),  # Lead only!
):
    """
    Streams the filtered audit trail as a downloadable CSV (lead only).
    Applies clearance redaction and formula-injection protection.
    """
    if format.lower() != "csv":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported export format '{format}'. Supported formats: csv.",
        )

    query = db.query(AuditLog)

    if actor and actor.strip():
        query = query.filter(AuditLog.actor == actor.strip().lower())
    if action and action.strip():
        query = query.filter(AuditLog.action == action.strip())
    if entity and entity.strip():
        query = query.filter(AuditLog.entity == entity.strip().lower())

    if from_date and from_date.strip():
        try:
            dt_from = datetime.fromisoformat(from_date.replace("Z", "+00:00"))
            query = query.filter(AuditLog.at >= dt_from)
        except Exception:
            pass

    if to_date and to_date.strip():
        try:
            dt_to = datetime.fromisoformat(to_date.replace("Z", "+00:00"))
            query = query.filter(AuditLog.at <= dt_to)
        except Exception:
            pass

    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                AuditLog.details.ilike(term),
                AuditLog.entity_id.ilike(term),
                AuditLog.actor.ilike(term),
                AuditLog.action.ilike(term),
                AuditLog.entity.ilike(term),
            )
        )

    logs = query.order_by(AuditLog.at.desc()).all()

    filename = f"handovertrail_audit_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        export_audit_csv_generator(logs, viewer_clearance=current_user.clearance),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
