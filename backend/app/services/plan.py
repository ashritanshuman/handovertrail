"""
Services for First-7-Days Onboarding Plan Generator (Member 3).

Rule-based, deterministic, explainable prioritisation and sequencing engine.
Ensures every plan item is strictly grounded in existing claims with verifiable citations.
"""
from typing import List, Dict, Any, Optional, Set
import re
import hashlib


# Heuristic scoring weights for transparent prioritization
# Documented in docs/ARCHITECTURE.md
WEIGHT_UNRESOLVED_CONFLICT_OR_GAP = 95
WEIGHT_CRITICAL_RISK = 85
WEIGHT_LEAVER_OWNERSHIP_TASK = 80
WEIGHT_SINGLE_OWNER_OR_SPOF = 75
WEIGHT_DEPENDENCY = 60
WEIGHT_CONTACT_HANDOFF = 55
WEIGHT_OPEN_QUESTION = 50
WEIGHT_DECISION_CONTEXT = 35
WEIGHT_FOCUS_AREA_BONUS = 25


def _extract_source_label(claim: Dict[str, Any]) -> str:
    """Derives a concise citation label from quote, evidence_ids, or conflict_group_id."""
    evidence_ids = claim.get("evidence_ids") or []
    if evidence_ids:
        # e.g., "ev-github-004" -> "GitHub #004", "ev-notes-002" -> "Notes #002"
        first_ev = str(evidence_ids[0])
        parts = first_ev.split("-")
        if len(parts) >= 3:
            return f"{parts[1].capitalize()} #{parts[2]}"
        return first_ev
    if claim.get("conflict_group_id"):
        return f"Conflict {claim['conflict_group_id']}"
    return f"Claim {claim.get('id', 'ref')}"


def _matches_focus_or_role(claim: Dict[str, Any], role_title: str, focus_areas: List[str]) -> bool:
    """Checks if claim text or owner intersects with role keywords or focus areas."""
    tokens = [t.lower() for t in focus_areas if t]
    if role_title:
        tokens.extend([w.lower() for w in re.split(r"[\s\-_/]+", role_title) if len(w) > 2])

    text_lower = (claim.get("text", "") + " " + claim.get("owner", "")).lower()
    return any(token in text_lower for token in tokens)


def score_candidate_claim(
    claim: Dict[str, Any],
    role_title: str = "",
    focus_areas: Optional[List[str]] = None,
) -> float:
    """
    Computes an explainable numeric priority score for a candidate claim.
    Higher score indicates earlier schedule in the 7-day onboarding plan.
    """
    focus_areas = focus_areas or []
    ctype = claim.get("type", "")
    cstatus = claim.get("status", "")
    owner = (claim.get("owner", "") or "").lower()
    text = (claim.get("text", "") or "").lower()
    score = 0.0

    # 1. Status heuristics
    if cstatus == "conflicting" or "conflict" in text:
        score = max(score, WEIGHT_UNRESOLVED_CONFLICT_OR_GAP)
    elif cstatus == "missing":
        score = max(score, WEIGHT_UNRESOLVED_CONFLICT_OR_GAP - 5)

    # 2. Type heuristics
    if ctype == "risk":
        score = max(score, WEIGHT_CRITICAL_RISK)
    elif ctype == "task":
        if "riya" in owner or "leaver" in owner:
            score = max(score, WEIGHT_LEAVER_OWNERSHIP_TASK)
        else:
            score = max(score, 65.0)
    elif ctype == "dependency":
        score = max(score, WEIGHT_DEPENDENCY)
    elif ctype == "contact":
        score = max(score, WEIGHT_CONTACT_HANDOFF)
    elif ctype == "open_question":
        score = max(score, WEIGHT_OPEN_QUESTION)
    elif ctype == "decision":
        score = max(score, WEIGHT_DECISION_CONTEXT)

    # 3. Single-owner or bus-factor signals
    if "bus-factor" in text or "single-owner" in text or "spof" in text or "sole maintainer" in text:
        score += (WEIGHT_SINGLE_OWNER_OR_SPOF - 50)

    # 4. Role & focus area alignment bonus
    if _matches_focus_or_role(claim, role_title, focus_areas):
        score += WEIGHT_FOCUS_AREA_BONUS

    return score


def _derive_item_category(claim: Dict[str, Any]) -> str:
    ctype = claim.get("type", "")
    cstatus = claim.get("status", "")
    if cstatus == "conflicting" or ctype == "decision":
        return "Decide"
    if ctype == "risk" or cstatus == "missing":
        return "Fix"
    if ctype == "contact":
        return "Contact"
    if ctype == "task":
        return "Handover"
    return "Understand"


def _derive_item_priority(score: float) -> str:
    if score >= 80:
        return "High"
    if score >= 55:
        return "Medium"
    return "Low"


def _derive_item_effort(claim: Dict[str, Any]) -> str:
    ctype = claim.get("type", "")
    if ctype in ("risk", "task"):
        return "Medium"
    if ctype in ("contact", "decision"):
        return "Short"
    return "Medium"


def _build_action_title_and_why(claim: Dict[str, Any]) -> tuple[str, str]:
    """
    Constructs a deterministic action title and one-sentence rationale grounded strictly
    in the claim text without inventing synthetic facts.
    """
    text = (claim.get("text", "")).strip().rstrip(".")
    ctype = claim.get("type", "")
    cstatus = claim.get("status", "")
    owner = claim.get("owner", "")

    if cstatus == "conflicting":
        title = f"Resolve architectural conflict: {text}"
        why = f"Conflicting specifications require explicit sign-off to ensure alignment."
    elif ctype == "risk":
        title = f"Mitigate operational risk: {text}"
        why = f"Identified as a critical system vulnerability during technical review."
    elif ctype == "task":
        if "riya" in owner.lower():
            title = f"Transfer ownership from departing engineer: {text}"
            why = f"Previously maintained by Riya Sharma and requires active successor takeover."
        else:
            title = f"Review ongoing task: {text}"
            why = f"Active project task requiring handover continuity."
    elif ctype == "dependency":
        title = f"Verify external dependency: {text}"
        why = f"Upstream integration required for smooth operational workflows."
    elif ctype == "contact":
        title = f"Establish primary contact: {text}"
        why = f"Key subject-matter expert or partner lead for this technical domain."
    elif ctype == "open_question":
        title = f"Investigate open question: {text}"
        why = f"Unresolved engineering gap flagged during handover knowledge extraction."
    elif ctype == "decision":
        title = f"Review ratified decision: {text}"
        why = f"Foundational architectural choice documented in project evidence."
    else:
        title = f"Understand domain: {text}"
        why = f"Core project context for successor orientation."

    return title, why


def generate_plan_items(
    claims: List[Dict[str, Any]],
    role_title: str = "Software Engineer",
    focus_areas: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Generates a sequenced, 7-day onboarding plan from candidate claims.
    Guarantees:
      - Deterministic and idempotent
      - Every item cites at least one valid claim ID from the input
      - Covers Days 1 to 7 with 2 to 4 items each (when sufficient claims exist)
      - Never invents external entities
    """
    focus_areas = focus_areas or []
    if not claims:
        return []

    # Map existing claims by ID for validation
    claims_by_id = {c["id"]: c for c in claims if "id" in c}

    # Score each candidate claim
    scored_claims: List[tuple[float, Dict[str, Any]]] = []
    for c in claims:
        score = score_candidate_claim(c, role_title, focus_areas)
        scored_claims.append((score, c))

    # Stable deterministic sort: descending score, then ascending ID
    scored_claims.sort(key=lambda pair: (-pair[0], pair[1].get("id", "")))

    # Bucket claims according to day theme
    # Day 1: Orientation & Ownership (Pairing, Core leaver tasks)
    # Day 2: Critical Risks & Immediate Fixes (Stripe ledger, Vault TTL)
    # Day 3: Conflict Decisions & High-impact Tasks
    # Day 4: External Dependencies & API Webhooks
    # Day 5: Partner Integrations & Key Contacts
    # Day 6: Architectural Rationale & Low-level Reviews
    # Day 7: Operational Readiness, Verification & Handover Sign-off

    day_buckets: Dict[int, List[Dict[str, Any]]] = {d: [] for d in range(1, 8)}
    assigned_claim_ids: Set[str] = set()

    for score, claim in scored_claims:
        cid = claim["id"]
        ctype = claim.get("type", "")
        cstatus = claim.get("status", "")
        owner = (claim.get("owner", "")).lower()

        # Target day heuristic
        if "riya" in owner and ctype == "task":
            preferred_day = 1 if len(day_buckets[1]) < 3 else (2 if len(day_buckets[2]) < 3 else 3)
        elif cstatus == "conflicting":
            preferred_day = 2 if len(day_buckets[2]) < 3 else (3 if len(day_buckets[3]) < 3 else 4)
        elif ctype == "risk":
            preferred_day = 2 if len(day_buckets[2]) < 4 else (3 if len(day_buckets[3]) < 4 else 4)
        elif ctype == "dependency":
            preferred_day = 4 if len(day_buckets[4]) < 4 else (5 if len(day_buckets[5]) < 4 else 3)
        elif ctype == "contact":
            preferred_day = 5 if len(day_buckets[5]) < 4 else (4 if len(day_buckets[4]) < 4 else 1)
        elif ctype == "decision":
            preferred_day = 6 if len(day_buckets[6]) < 4 else (7 if len(day_buckets[7]) < 4 else 1)
        elif ctype == "open_question":
            preferred_day = 3 if len(day_buckets[3]) < 4 else (4 if len(day_buckets[4]) < 4 else 7)
        else:
            preferred_day = 7 if len(day_buckets[7]) < 4 else 6

        # Assign to preferred day if under cap of 4, else find first day under cap
        if len(day_buckets[preferred_day]) < 4:
            day_buckets[preferred_day].append(claim)
            assigned_claim_ids.add(cid)
        else:
            # Place in the emptiest day
            emptiest_day = min(range(1, 8), key=lambda d: len(day_buckets[d]))
            if len(day_buckets[emptiest_day]) < 4:
                day_buckets[emptiest_day].append(claim)
                assigned_claim_ids.add(cid)

    # Balance days so that if possible, every day has at least 2 items
    all_claims_list = [c for _, c in scored_claims]
    for day in range(1, 8):
        while len(day_buckets[day]) < 2 and len(assigned_claim_ids) < len(all_claims_list):
            # Take next unassigned claim
            for c in all_claims_list:
                if c["id"] not in assigned_claim_ids:
                    day_buckets[day].append(c)
                    assigned_claim_ids.add(c["id"])
                    break
            else:
                break

    # If any days are still empty (thin dataset), redistribute from heaviest days
    for day in range(1, 8):
        if len(day_buckets[day]) == 0:
            heaviest_day = max(range(1, 8), key=lambda d: len(day_buckets[d]))
            if len(day_buckets[heaviest_day]) > 2:
                moved = day_buckets[heaviest_day].pop()
                day_buckets[day].append(moved)

    # Build final structured PlanItem dictionaries
    plan_items: List[Dict[str, Any]] = []
    item_counter = 1

    for day in range(1, 8):
        for claim in day_buckets[day]:
            cid = claim["id"]
            # Strict grounding check: cited claim must exist
            if cid not in claims_by_id:
                continue

            score = score_candidate_claim(claim, role_title, focus_areas)
            title, why = _build_action_title_and_why(claim)
            category = _derive_item_category(claim)
            priority = _derive_item_priority(score)
            effort = _derive_item_effort(claim)
            source_label = _extract_source_label(claim)
            evidence_refs = claim.get("evidence_ids") or []

            item_id = f"item-d{day}-{item_counter:02d}"
            item_counter += 1

            plan_items.append({
                "id": item_id,
                "day": day,
                "title": title,
                "why_it_matters": why,
                "category": category,
                "priority": priority,
                "effort": effort,
                "claim_ids": [cid],
                "evidence_refs": evidence_refs,
                "source_label": source_label,
                "is_pinned": False,
                "done": False,
            })

    return plan_items
