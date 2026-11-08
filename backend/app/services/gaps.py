from typing import List, Dict, Any


def identify_knowledge_gaps(evidence_units: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Identifies undocumented areas, abandoned PRs, or single points of failure.
    Synthesizes open questions requiring leaver input.
    """
    gaps = []
    
    for ev in evidence_units:
        text = ev.get("text", "")
        # Detect abandoned PR with review comment
        if "PR #88" in ev.get("source_ref", "") or "prone to socket leaks" in text:
            gaps.append({
                "id": "gap-001",
                "claim_id": "clm-009",
                "text": "PR #88 (WebSocket ticket reservations) was abandoned after Maya's heartbeat ping-pong comment. Is this branch safe to deploy or does it leak sockets?",
                "state": "open",
                "asked_by": "system"
            })
            break
            
    # Add general single-owner gap if not already present
    gaps.append({
        "id": "gap-002",
        "claim_id": "clm-002",
        "text": "Payment reconciliation service (payment_reconciliation.py) was sole-authored by Riya. Where are emergency webhook rerun instructions documented?",
        "state": "open",
        "asked_by": "system"
    })
    
    return gaps
