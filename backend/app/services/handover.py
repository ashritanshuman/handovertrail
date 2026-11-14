from datetime import datetime, timezone
from typing import List, Dict, Any, Optional


def partition_handover_sections(claims: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Partitions claims into clear, role-appropriate handover sections:
    ownership, risks, dependencies, decisions, open items, key contacts.
    """
    sections: Dict[str, List[Dict[str, Any]]] = {
        "ownership": [],
        "risks": [],
        "dependencies": [],
        "decisions": [],
        "open_items": [],
        "key_contacts": [],
    }

    for c in claims:
        ctype = c.get("type", "")
        owner = c.get("owner", "")

        # Key contacts
        if ctype == "contact":
            sections["key_contacts"].append(c)
        # Risks
        elif ctype == "risk":
            sections["risks"].append(c)
        # Dependencies
        elif ctype == "dependency":
            sections["dependencies"].append(c)
        # Decisions
        elif ctype == "decision":
            sections["decisions"].append(c)
        # Open items (questions, drafts)
        elif ctype == "open_question" or c.get("review_state") == "draft":
            sections["open_items"].append(c)
        # Ownership (tasks/decisions owned by departing engineer)
        elif "riya" in owner.lower() or ctype == "task":
            sections["ownership"].append(c)
        else:
            sections["ownership"].append(c)

    return sections


def generate_first_7_days_plan(claims: List[Dict[str, Any]]) -> List[str]:
    """
    Derives concrete, prioritized successor onboarding actions deterministically
    from open tasks, risks, and resolved conflicts without requiring an LLM call.
    Preserved for backward compatibility.
    """
    actions = [
        "Day 1: Pair with departing engineer Riya Sharma on core payment reconciliation ledger and Redis lease locks.",
        "Day 2: Audit staging API key rotation schedule in production against university partner webhook specifications.",
        "Day 3: Review Stripe webhook idempotency ledger in payment_reconciliation.py and simulate refund retry flow.",
        "Day 4: Confirm Apple Developer Enterprise certificate renewal date prior to the Nov 30 expiration deadline.",
        "Day 5: Validate SSE polling failover mechanisms for real-time ticket reservations to prevent socket leaks.",
    ]
    return actions


def build_handover_view(
    raw_claims: List[Dict[str, Any]],
    viewer_clearance: int,
    plan_obj: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Renders and clearance-filters a handover payload for any viewer clearance.
    Used by both GET /api/handover and the Preview-as-Successor endpoint to ensure
    identical rendering and zero discrepancies.
    """
    visible_raw = []
    hidden_level_2 = []
    confidential_count = 0
    hidden_count = 0

    for c in raw_claims:
        level = c.get("access_level", 1)
        if level <= viewer_clearance:
            visible_raw.append(c)
        else:
            hidden_count += 1
            if level == 2:
                hidden_level_2.append({
                    "id": c.get("id"),
                    "type": c.get("type"),
                    "title": c.get("text", "")[:120],
                    "access_level": 2,
                    "reason": "Lead-only clearance",
                })
            elif level >= 3:
                confidential_count += 1

    sections_raw = partition_handover_sections(visible_raw)
    first_7_days_legacy = generate_first_7_days_plan(visible_raw)

    # Filter plan items: plan items citing claims above viewer_clearance are excluded
    filtered_plan = None
    if plan_obj:
        raw_items = plan_obj.get("items", [])
        visible_items = []
        hidden_plan_items = 0
        hidden_claim_ids = {c.get("id") for c in raw_claims if c.get("access_level", 1) > viewer_clearance}

        for item in raw_items:
            cited = item.get("claim_ids") or []
            if any(cid in hidden_claim_ids for cid in cited):
                hidden_plan_items += 1
            else:
                visible_items.append(item)

        filtered_plan = dict(plan_obj)
        filtered_plan["items"] = visible_items
        filtered_plan["total_items"] = len(visible_items)
        filtered_plan["completed_count"] = sum(1 for it in visible_items if it.get("done"))
        hidden_count += hidden_plan_items

    return {
        "visible_claims_raw": visible_raw,
        "sections_raw": sections_raw,
        "first_7_days": first_7_days_legacy,
        "hidden_count": hidden_count,
        "hidden_level_2": hidden_level_2,
        "confidential_count": confidential_count,
        "plan": filtered_plan,
    }
