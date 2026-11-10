import re
from typing import List, Tuple, Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from app.models import EvidenceUnit, Claim


def normalize_text(text: str) -> str:
    """Normalizes whitespace and converts to lower case for deterministic verification."""
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text)
    return text.strip().lower()


def verify_quote_against_evidence(quote: str, evidence_texts: List[str]) -> Tuple[bool, Optional[str]]:
    """
    Deterministic check: returns True if quote is contained verbatim in any evidence text
    after whitespace and case normalization.
    """
    if not quote or not quote.strip():
        return False, None

    norm_quote = normalize_text(quote)
    for ev_text in evidence_texts:
        norm_ev = normalize_text(ev_text)
        if norm_quote in norm_ev:
            return True, ev_text

    return False, None


def determine_claim_verification(
    claim_type: str,
    claim_text: str,
    quote: str,
    cited_units: List[Union[EvidenceUnit, Dict[str, Any]]]
) -> Tuple[str, int]:
    """
    Evaluates verification status and access level deterministically:
    - Quote not found, empty, or unknown evidence_ids -> 'missing'
    - Risk or inference where quote exists but conclusion goes beyond it -> 'inferred'
    - Exact verbatim quote found in cited evidence -> 'verified'
    - access_level = max(access_level of cited units)
    """
    if not cited_units:
        return "missing", 1

    access_levels = [
        u.access_level if hasattr(u, "access_level") else int(u.get("access_level", 1))
        for u in cited_units
    ]
    max_level = max(access_levels) if access_levels else 1

    if not quote or not quote.strip():
        return "missing", max_level

    ev_texts = [
        u.text if hasattr(u, "text") else u.get("text", "")
        for u in cited_units
    ]

    is_verified, matched_ev = verify_quote_against_evidence(quote, ev_texts)
    if not is_verified:
        return "missing", max_level

    # Check if claim type is risk/inference where text extends beyond cited quote
    norm_text = normalize_text(claim_text)
    norm_quote = normalize_text(quote)
    if claim_type == "risk":
        # If the quote notes a concern but the claim asserts a broader consequence, mark inferred
        if norm_quote not in norm_text and len(norm_text) > len(norm_quote) * 1.5:
            return "inferred", max_level

    return "verified", max_level


def reverify_claim(claim: Claim, db: Session) -> str:
    """
    Re-verifies a claim automatically after human edits or updates.
    Updates claim.status and claim.access_level.
    """
    evidence_ids = claim.evidence_ids or []
    cited_units = (
        db.query(EvidenceUnit)
        .filter(EvidenceUnit.id.in_(evidence_ids))
        .all()
    ) if evidence_ids else []

    status, level = determine_claim_verification(
        claim_type=claim.type,
        claim_text=claim.text,
        quote=claim.quote,
        cited_units=cited_units,
    )

    # Preserve conflicting status unless human resolved
    if claim.status == "conflicting" and claim.review_state not in ("confirmed", "edited"):
        claim.access_level = level
        return "conflicting"

    claim.status = status
    claim.access_level = level
    return status
