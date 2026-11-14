import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models import ConflictGroup, Claim, AuditLog, Question, EvidenceUnit, User

# Definition of multi-attribute deterministic conflict detection rules
# Covers:
# 1. Values & periods (cg-api-key-rotation)
# 2. Primary ownership (cg-owner-payment-recon)
# 3. Dates & deadlines (cg-date-cert-cutover)
# 4. Status & tool choices (cg-status-websocket-sse) with supersession detection
CONFLICT_RULES = [
    {
        "id": "cg-api-key-rotation",
        "topic": "Security & Credential Management",
        "attribute": "period",
        "entity": "Payment Provider API Key Rotation",
        "type": "contradiction",
        "confidence": "high",
        "keywords": ["rotation", "rotate", "api key", "monthly", "quarterly", "30-day", "90-day", "vault ttl"],
        "statement_a": "Issue #42 (ev-github-001): Payment provider API key must be rotated monthly every 30 days per PCI requirement.",
        "statement_b": "12 Oct Meeting Notes (ev-notes-002): Agreed to rotate external API keys quarterly (90 days) to avoid breaking webhook integrations.",
        "suggestion": "Leaver notes clarify 90-day Vault lease in sprint notes; matches Claim B (quarterly).",
    },
    {
        "id": "cg-owner-payment-recon",
        "topic": "Architecture & Module Ownership",
        "attribute": "owner",
        "entity": "Payment Reconciliation Ledger",
        "type": "contradiction",
        "confidence": "high",
        "keywords": ["payment reconciliation", "reconciliation ledger", "sole-authored", "failover", "assumed primary ownership", "assigned solely"],
        "statement_a": "Task #104 (ev-task-004): Payment reconciliation service assigned solely to Riya Sharma with no secondary reviewer.",
        "statement_b": "26 Oct Sprint Notes (ev-notes-011): Maya Patel confirmed she has assumed primary ownership of payment reconciliation failover.",
        "suggestion": "Maya assumed ownership on 26 Oct to prepare for leaver transition; matches Maya Patel ownership.",
    },
    {
        "id": "cg-date-cert-cutover",
        "topic": "Mobile Infrastructure & Apple APNS",
        "attribute": "date",
        "entity": "iOS APNS Enterprise Certificate Cutover",
        "type": "contradiction",
        "confidence": "high",
        "keywords": ["apple developer enterprise", "certificate renewal", "november 30", "november 15", "cutover deadline", "two-week safety buffer"],
        "statement_a": "Slack #engineering (ev-slack-008): Apple Developer Enterprise certificate renewal date is strictly November 30.",
        "statement_b": "Mobile Sync Notes (ev-notes-012): Team agreed on November 15 as the hard cutover deadline to provide a safety buffer.",
        "suggestion": "November 15 is the intentional internal cutover buffer before the hard November 30 expiration.",
    },
    {
        "id": "cg-status-websocket-sse",
        "topic": "Realtime Architecture & Concurrency",
        "attribute": "status",
        "entity": "Realtime Ticket Reservation Transport",
        "type": "supersession",
        "confidence": "high",
        "keywords": ["websocket reservation", "pub-sub is deployed", "pr #88", "sse polling", "socket leaks", "abandoned"],
        "statement_a": "Task #119 (ev-task-015): WebSocket reservation pub-sub is deployed in production and active for student flash ticket drops.",
        "statement_b": "PR #88 & PR #94 (ev-github-005, ev-github-007): PR #88 WebSocket was abandoned due to socket leaks and superseded by SSE polling.",
        "suggestion": "Possibly superseded: PR #94 Server-Sent Events replaced WebSocket transport. Recommend rejecting Task #119.",
    },
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


def sync_conflict_groups(db: Session, project_id: str = "campusconnect") -> List[ConflictGroup]:
    """
    Synchronizes detected conflicts into the conflict_groups database table idempotently.
    Does not duplicate groups, preserves existing resolved/dismissed states,
    and updates claims in DB with status='conflicting' and conflict_group_id.
    """
    claims = db.query(Claim).filter(Claim.project_id == project_id).all()
    created_or_updated: List[ConflictGroup] = []

    for rule in CONFLICT_RULES:
        group_id = rule["id"]
        existing_group = db.query(ConflictGroup).filter(ConflictGroup.id == group_id).first()

        # Find matching claims in database
        rule_kw = rule["keywords"]
        matching_claims: List[Claim] = []
        for claim in claims:
            # Skip resolved human claims
            if claim.review_state in ("confirmed", "edited") and claim.origin == "human":
                continue

            combined = f"{claim.text} {claim.quote}".lower()
            hits = sum(1 for kw in rule_kw if kw in combined)
            if hits >= 2:
                matching_claims.append(claim)

        if not matching_claims and not existing_group:
            continue

        if not existing_group:
            new_group = ConflictGroup(
                id=group_id,
                project_id=project_id,
                topic=rule["topic"],
                attribute=rule["attribute"],
                entity=rule["entity"],
                type=rule["type"],
                confidence=rule["confidence"],
                status="open",
                suggestion=rule.get("suggestion"),
            )
            db.add(new_group)
            existing_group = new_group

            audit = AuditLog(
                id=f"aud-cdet-{uuid.uuid4().hex[:12]}",
                actor="system",
                action="conflict_detected",
                entity="conflict_group",
                entity_id=group_id,
                before_json={},
                after_json={
                    "topic": rule["topic"],
                    "entity": rule["entity"],
                    "attribute": rule["attribute"],
                    "status": "open",
                },
                details=f"Conflict detected on entity '{rule['entity']}' (attribute: {rule['attribute']}).",
            )
            db.add(audit)

        # If group is open, ensure matching claims have conflicting status & conflict_group_id
        if existing_group.status == "open":
            for mc in matching_claims:
                if mc.review_state not in ("confirmed", "edited") or mc.origin != "human":
                    mc.status = "conflicting"
                    mc.conflict_group_id = group_id

        created_or_updated.append(existing_group)

    db.commit()
    return created_or_updated
