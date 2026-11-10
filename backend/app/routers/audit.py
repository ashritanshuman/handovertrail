from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import AuditLog, User
from app.schemas import AuditLogRead
from app.security import require_lead

router = APIRouter(prefix="/api/audit", tags=["Audit"])


@router.get("", response_model=List[AuditLogRead])
def list_audit_trail(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead),  # Lead only!
):
    """
    Returns an immutable audit log of all system mutations and sign-offs.
    Accessible only to team leads (e.g. Maya).
    """
    logs = db.query(AuditLog).order_by(AuditLog.at.desc()).limit(100).all()
    return logs
