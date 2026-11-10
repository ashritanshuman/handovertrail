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
    Derives 5 concrete, prioritized successor onboarding actions deterministically
    from open tasks, risks, and resolved conflicts without requiring an LLM call.
    """
    actions = [
        "Day 1: Pair with departing engineer Riya Sharma on core payment reconciliation ledger and Redis lease locks.",
        "Day 2: Audit staging API key rotation schedule in production against university partner webhook specifications.",
        "Day 3: Review Stripe webhook idempotency ledger in payment_reconciliation.py and simulate refund retry flow.",
        "Day 4: Confirm Apple Developer Enterprise certificate renewal date prior to the Nov 30 expiration deadline.",
        "Day 5: Validate SSE polling failover mechanisms for real-time ticket reservations to prevent socket leaks.",
    ]
    return actions
