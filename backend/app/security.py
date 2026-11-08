from typing import Optional, List, TypeVar, Any
from fastapi import Header, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User

# Standard seeded user mapping
SEEDED_USERS = {
    "riya": {
        "id": "riya",
        "name": "Riya Sharma",
        "role": "leaver",
        "clearance": 2,
        "email": "riya.sharma@campusconnect.dev",
    },
    "maya": {
        "id": "maya",
        "name": "Maya Patel",
        "role": "lead",
        "clearance": 2,
        "email": "maya.patel@campusconnect.dev",
    },
    "arjun": {
        "id": "arjun",
        "name": "Arjun Rao",
        "role": "successor",
        "clearance": 1,
        "email": "arjun.rao@campusconnect.dev",
    },
}


def get_current_user(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db),
) -> User:
    """
    Simulates identity and clearance based on X-User-Id header.
    Defaults to 'arjun' (Successor, Clearance 1) if omitted.
    """
    user_id = (x_user_id or "arjun").lower().strip()

    # Look up in DB
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        if user_id in SEEDED_USERS:
            seed = SEEDED_USERS[user_id]
            user = User(
                id=seed["id"],
                name=seed["name"],
                role=seed["role"],
                clearance=seed["clearance"],
                email=seed["email"],
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Unknown user '{user_id}'. Allowed demo users: riya, maya, arjun.",
            )
    return user


def require_lead(user: User = Depends(get_current_user)) -> User:
    """Enforces that the caller has lead role (e.g. Maya) for approving and editing."""
    if user.role != "lead":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: only an authorized project lead can perform this action.",
        )
    return user


T = TypeVar("T")


def filter_by_clearance(items: List[T], clearance: int) -> List[T]:
    """Filters items where item.access_level <= clearance."""
    filtered = []
    for item in items:
        level = getattr(item, "access_level", 1)
        if level <= clearance:
            filtered.append(item)
    return filtered
