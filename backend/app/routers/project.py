from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Project, User, HandoverVersion
from app.schemas import ProjectRead, UserRead
from app.security import get_current_user

router = APIRouter(prefix="/api/project", tags=["Project"])


@router.get("", response_model=ProjectRead)
def get_project_details(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns project metadata, leaver & lead details, and current handover state.
    """
    project = db.query(Project).filter(Project.id == "campusconnect").first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not loaded yet. Call POST /api/demo/load first.",
        )

    leaver = db.query(User).filter(User.role == "leaver").first()
    lead = db.query(User).filter(User.role == "lead").first()
    
    # Check if approved handover exists
    approved_handover = (
        db.query(HandoverVersion)
        .filter(HandoverVersion.project_id == project.id)
        .first()
    )
    handover_state = "approved" if approved_handover else "in_review"

    return ProjectRead(
        id=project.id,
        name=project.name,
        description=project.description,
        repo_url=project.repo_url,
        handover_state=handover_state,
        leaver=UserRead.model_validate(leaver) if leaver else None,
        lead=UserRead.model_validate(lead) if lead else None,
        created_at=project.created_at,
    )
