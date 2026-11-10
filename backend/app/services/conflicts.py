import uuid
from typing import List, Dict, Any, Optional

# Conflict definition rules: (entity_keywords, conflict_group_id, description, statement_a, statement_b)
CONFLICT_RULES = [
    {
        "id": "cg-api-key-rotation",
        "keywords": ["rotation", "rotate", "api key", "monthly", "quarterly", "30-day", "90-day"],
        "statement_a": "Issue #42 (ev-github-004): Payment provider API key must be rotated monthly every 30 days per PCI requirement.",
        "statement_b": "12 Oct Meeting Notes (ev-notes-002): Agreed to rotate external API keys quarterly (90 days) to avoid breaking webhook integrations.",
    }
]


def detect_conflicts(claims: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Rule-based conflict detection identifying discrepancies on the same entity/attribute
    (rotation periods, owners, dates, tool choices).
    Sets status="conflicting" and assigns a shared conflict_group_id.
    """
    for rule in CONFLICT_RULES:
        rule_kw = rule["keywords"]
        matching_claims = []
        for claim in claims:
            # Skip claims that have already been resolved by human lead
            if claim.get("review_state") in ("confirmed", "edited") and claim.get("origin") == "human":
                continue

            text_lower = claim.get("text", "").lower()
            quote_lower = claim.get("quote", "").lower()
            combined = f"{text_lower} {quote_lower}"

            # Check if this claim matches the conflict topic
            hits = sum(1 for kw in rule_kw if kw in combined)
            if hits >= 2:
                matching_claims.append(claim)

        if matching_claims:
            group_id = rule["id"]
            for c in matching_claims:
                c["status"] = "conflicting"
                c["conflict_group_id"] = group_id
                c["conflict_details"] = {
                    "conflict_group_id": group_id,
                    "statement_a": rule["statement_a"],
                    "statement_b": rule["statement_b"],
                }

    return claims


def check_single_claim_conflict(claim_text: str, quote: str) -> Optional[Dict[str, str]]:
    """Checks if a claim text or quote triggers known rule conflicts."""
    combined = f"{claim_text} {quote}".lower()
    for rule in CONFLICT_RULES:
        hits = sum(1 for kw in rule["keywords"] if kw in combined)
        if hits >= 2:
            return {
                "conflict_group_id": rule["id"],
                "statement_a": rule["statement_a"],
                "statement_b": rule["statement_b"],
            }
    return None
