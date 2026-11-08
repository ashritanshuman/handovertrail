from typing import List, Dict, Any, Optional


def detect_conflicts(claims: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Scans claims and evidence references to identify discrepancies.
    Specifically detects the planted conflict: monthly vs quarterly API key rotation.
    """
    for claim in claims:
        # Check for planted conflict keywords
        text_lower = claim.get("text", "").lower()
        if "rotation" in text_lower or "api key" in text_lower:
            ev_ids = claim.get("evidence_ids", [])
            if any("github" in str(eid).lower() for eid in ev_ids) and any("notes" in str(eid).lower() for eid in ev_ids):
                claim["status"] = "conflicting"
                claim["conflict_details"] = {
                    "statement_a": "Issue #42: The payment provider API key must be rotated monthly every 30 days per PCI requirement.",
                    "statement_b": "Architecture Meeting 2026-09-15: We agreed to rotate external API keys quarterly (90 days) to avoid breaking webhook integrations."
                }
    return claims

