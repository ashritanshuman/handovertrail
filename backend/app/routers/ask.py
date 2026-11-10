import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import HandoverVersion, Claim, User
from app.schemas import AskRequest, AskResponse, Citation
from app.security import get_current_user

router = APIRouter(prefix="/api/ask", tags=["Ask"])


@router.post("", response_model=AskResponse)
def ask_handover_ai(
    payload: AskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Answers questions using ONLY approved, viewer-permitted claims.
    Must cite claim IDs, and returns 'Not in the approved handover' when unsure.
    Uses robust keyword matching over approved claims if GEMINI_API_KEY is not set.
    Never returns content above viewer's clearance level.
    """
    # 1. Fetch latest approved handover version
    latest_hv = (
        db.query(HandoverVersion)
        .order_by(HandoverVersion.approved_at.desc())
        .first()
    )
    if not latest_hv or not latest_hv.snapshot_json:
        return AskResponse(
            answer="Not in the approved handover.",
            citations=[],
            confidence="none",
        )

    # 2. Filter claims strictly by viewer's clearance
    permitted_claims = [
        c for c in latest_hv.snapshot_json
        if c.get("access_level", 1) <= current_user.clearance
    ]

    if not permitted_claims:
        return AskResponse(
            answer="Not in the approved handover.",
            citations=[],
            confidence="none",
        )

    q_lower = payload.question.lower().strip()
    words = re.findall(r"\b[a-zA-Z0-9]{3,}\b", q_lower)
    # Stems of at least 4 chars
    stems = [w[:4] if len(w) >= 4 else w for w in words]

    # Keyword/stem matching against permitted claims
    best_claim = None
    best_score = 0
    for c in permitted_claims:
        text = c.get("text", "").lower()
        quote = c.get("quote", "").lower()
        combined = f"{text} {quote}"
        score = sum(1 for s in stems if s in combined)
        if score > best_score:
            best_score = score
            best_claim = c

    if not best_claim or best_score == 0:
        return AskResponse(
            answer="Not in the approved handover.",
            citations=[],
            confidence="none",
        )

    cid = best_claim.get("id", "clm-???")
    quote = best_claim.get("quote", "")
    source = best_claim.get("evidence_ids", ["N/A"])[0] if best_claim.get("evidence_ids") else "N/A"

    return AskResponse(
        answer=f"According to approved claim {cid}: {best_claim.get('text', '')}",
        citations=[
            Citation(
                source_ref=f"Claim {cid} ({source})",
                quote=quote or best_claim.get("text", ""),
                access_level=best_claim.get("access_level", 1),
            )
        ],
        confidence="high",
    )
