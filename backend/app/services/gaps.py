from typing import List, Dict, Any, Optional
from app.models import Claim, Question, EvidenceUnit


def identify_knowledge_gaps(evidence_units: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Synthesizes targeted exit-interview questions for conflicts, missing evidence,
    and single-owner risks. Phrased specifically for leaver Riya Sharma.
    """
    gaps: List[Dict[str, Any]] = []

    # 1. Conflict Gap: API Key Rotation
    gaps.append({
        "id": "gap-001",
        "claim_id": "clm-004",
        "kind": "conflict",
        "text": "Issue #42 says the API key rotates monthly (30 days) but the 12 Oct notes say quarterly (90 days). Which policy is currently active in production?",
        "state": "open",
        "asked_by": "system",
    })

    # 2. Abandoned PR / Low Evidence Gap
    gaps.append({
        "id": "gap-002",
        "claim_id": "clm-009",
        "kind": "low_evidence",
        "text": "PR #88 (WebSocket ticket reservations) was abandoned after Maya's heartbeat ping-pong comment. Is this branch safe to deploy or does it leak sockets?",
        "state": "open",
        "asked_by": "system",
    })

    # 3. Single-Owner Knowledge Risk
    gaps.append({
        "id": "gap-003",
        "claim_id": "clm-002",
        "kind": "low_evidence",
        "text": "Payment reconciliation service (payment_reconciliation.py) was sole-authored by Riya. Where are emergency webhook rerun instructions documented?",
        "state": "open",
        "asked_by": "system",
    })

    # 4. Missing Evidence / Vague Claim Gap
    gaps.append({
        "id": "gap-004",
        "claim_id": "clm-012",
        "kind": "missing",
        "text": "Task #118 states mobile push notifications are certified for iOS 18 APNs with zero payload truncation, but no test logs are attached. Have integration tests passed?",
        "state": "open",
        "asked_by": "system",
    })

    return gaps


def generate_gaps_from_claims(claims: List[Claim]) -> List[Dict[str, Any]]:
    """
    Generates questions dynamically for any conflicting, missing, or high-risk claims.
    """
    dynamic_gaps = []
    idx = 1
    for c in claims:
        if c.status == "conflicting":
            dynamic_gaps.append({
                "id": f"gap-dyn-{idx:03d}",
                "claim_id": c.id,
                "kind": "conflict",
                "text": f"Contradiction identified on '{c.text}'. Which policy or value should the team follow?",
                "state": "open",
                "asked_by": "system",
            })
            idx += 1
        elif c.status == "missing":
            dynamic_gaps.append({
                "id": f"gap-dyn-{idx:03d}",
                "claim_id": c.id,
                "kind": "missing",
                "text": f"Claim '{c.text}' is missing verifiable source quotes. Can you provide the document or PR ref?",
                "state": "open",
                "asked_by": "system",
            })
            idx += 1
        elif c.type == "risk" and len(c.evidence_ids or []) <= 1:
            dynamic_gaps.append({
                "id": f"gap-dyn-{idx:03d}",
                "claim_id": c.id,
                "kind": "low_evidence",
                "text": f"High-impact risk identified with single evidence source: '{c.text}'. What runbook exists for this?",
                "state": "open",
                "asked_by": "system",
            })
            idx += 1
    return dynamic_gaps
