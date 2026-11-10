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
    Missing or unknown header -> 401 Unauthorized.
    """
    if not x_user_id or not x_user_id.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-User-Id header. Allowed demo users: riya, maya, arjun.",
        )

    user_id = x_user_id.lower().strip()

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


def require_role(*allowed_roles: str):
    """Factory dependency requiring user to have one of the specified roles."""
    def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: role '{user.role}' not permitted. Requires: {', '.join(allowed_roles)}.",
            )
        return user
    return role_checker


# Role helpers
require_lead = require_role("lead")
require_lead_or_leaver = require_role("lead", "leaver")


T = TypeVar("T")


def filter_by_clearance(items: List[T], clearance: int) -> List[T]:
    """Filters items where item.access_level <= clearance."""
    filtered = []
    for item in items:
        level = getattr(item, "access_level", 1)
        if level <= clearance:
            filtered.append(item)
    return filtered
