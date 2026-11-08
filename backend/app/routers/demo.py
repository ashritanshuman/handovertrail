from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas import DemoLoadRequest, DemoLoadResponse
from app.fixtures.seed_data import seed_database
from app.security import get_current_user
from app.models import User

router = APIRouter(prefix="/api/demo", tags=["Demo"])


@router.post("/load", response_model=DemoLoadResponse)
def load_demo_data(
    payload: DemoLoadRequest = DemoLoadRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Resets and populates the database with the synthetic CampusConnect dataset.
    """
    res = seed_database(db, force_reset=payload.force_reset)
    return res

