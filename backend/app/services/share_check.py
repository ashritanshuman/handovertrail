"""
Confidentiality and Safety Share Check Service (Member 3).

Audits candidate handover claims and plan items prior to publication.
Detects secret patterns, canary strings, access-level inconsistencies, and unmasked PII.
Never echoes raw sensitive values in findings.
"""
from typing import List, Dict, Any, Tuple
import re


# Regex patterns for dangerous unmasked credentials
SECRET_PATTERNS = [
    (re.compile(r"sk_live_[a-zA-Z0-9_-]{20,}", re.IGNORECASE), "Stripe/Service Live API Key"),
    (re.compile(r"sk_test_[a-zA-Z0-9_-]{20,}", re.IGNORECASE), "Stripe/Service Test API Key"),
    (re.compile(r"ghp_[a-zA-Z0-9]{30,}", re.IGNORECASE), "GitHub Personal Access Token"),
    (re.compile(r"AKIA[0-9A-Z]{16}", re.IGNORECASE), "AWS Access Key ID"),
    (re.compile(r"(?:bearer\s+[a-zA-Z0-9_\-\.]{30,})", re.IGNORECASE), "Bearer Authentication Token"),
]

# Robust phone pattern matching unmasked Indian/international phone numbers
PHONE_PATTERN = re.compile(r"\+?[0-9]{1,3}[-.\s]?[0-9]{3,5}[-.\s]?[0-9]{4,6}")

CANARY_STRINGS = [
    "CANARY-LEVEL3-DO-NOT-LEAK",
    "CANARY-LEVEL2-HR",
]

# Sensitive personal email pattern (protects personal PII without flagging legitimate partner contacts)
SENSITIVE_PERSONAL_EMAIL_PATTERN = re.compile(
    r"(?i)\b[a-zA-Z0-9_.+-]+@(?:personal|gmail|yahoo|hotmail|proton|protonmail)\.[a-zA-Z]{2,}\b"
)
GENERIC_EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
ALLOWED_DOMAINS = [
    "@campusconnect.dev",
    "@campusconnect.org",
    "@university.edu",
    "@stripe-partner.com",
    "@campusconnect.internal",
]


def run_share_check(
    claims: List[Dict[str, Any]],
    plan_items: List[Dict[str, Any]],
    evidence_lookup: Dict[str, Dict[str, Any]],
    successor_clearance: int = 1,
) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Audits candidate claims and plan items for security and confidentiality risks.

    Returns:
        (can_publish, findings_list)
        where can_publish is False if ANY 'block' severity findings exist.
    """
    findings: List[Dict[str, Any]] = []

    hidden_claim_ids = {
        c.get("id") for c in claims
        if c.get("access_level", 1) > successor_clearance
    }

    # 1. Audit Claims
    for c in claims:
        cid = c.get("id", "unknown")
        text = c.get("text", "")
        quote = c.get("quote", "")
        combined_text = f"{text} {quote}"
        access_level = c.get("access_level", 1)
        cstatus = c.get("status", "")
        evidence_ids = c.get("evidence_ids") or []

        # Check Canary strings (BLOCK)
        for canary in CANARY_STRINGS:
            if canary in combined_text:
                findings.append({
                    "severity": "block",
                    "category": "Canary Leak Detected",
                    "message": "Canary detection string present in claim content.",
                    "location": f"claim:{cid}",
                })

        # Check Secret patterns (BLOCK)
        for pattern, label in SECRET_PATTERNS:
            if pattern.search(combined_text):
                findings.append({
                    "severity": "block",
                    "category": "Unmasked Secret Pattern",
                    "message": f"Identified potential {label} in claim text or quote.",
                    "location": f"claim:{cid}",
                })

        # Check unmasked phone numbers (BLOCK)
        # Excludes already masked markers like [REDACTED:phone]
        clean_text_no_redactions = re.sub(r"\[REDACTED:[^\]]+\]", "", combined_text)
        if PHONE_PATTERN.search(clean_text_no_redactions):
            findings.append({
                "severity": "block",
                "category": "Unmasked Phone Number",
                "message": "Raw contact phone number detected without required pre-storage redaction.",
                "location": f"claim:{cid}",
            })

        # Check unmasked personal emails (BLOCK)
        if SENSITIVE_PERSONAL_EMAIL_PATTERN.search(combined_text):
            findings.append({
                "severity": "block",
                "category": "External Personal Email",
                "message": "Unmasked personal or external email address detected.",
                "location": f"claim:{cid}",
            })
        else:
            for email_match in GENERIC_EMAIL_PATTERN.finditer(combined_text):
                found_email = email_match.group(0).lower()
                if not any(found_email.endswith(dom) for dom in ALLOWED_DOMAINS):
                    findings.append({
                        "severity": "warn",
                        "category": "External Contact Email",
                        "message": f"External contact email detected in claim citation.",
                        "location": f"claim:{cid}",
                    })

        # Check Access Level Inconsistency:
        # If claim is marked Team-accessible (level 1), verify its evidence.
        # If ALL cited evidence units are restricted (> 1), this is a complete inconsistency (BLOCK).
        # If SOME cited units are restricted while others are level 1, this is mixed evidence (WARN).
        if access_level <= successor_clearance and evidence_ids:
            ev_levels = [
                evidence_lookup.get(eid, {}).get("access_level", 1)
                for eid in evidence_ids
            ]
            if all(lvl > successor_clearance for lvl in ev_levels):
                findings.append({
                    "severity": "block",
                    "category": "Access Level Inconsistency",
                    "message": f"Team-accessible claim has no Level 1 evidence (all cited units are Level > {successor_clearance}).",
                    "location": f"claim:{cid}",
                })
            elif any(lvl > successor_clearance for lvl in ev_levels):
                findings.append({
                    "severity": "warn",
                    "category": "Access Level Inconsistency",
                    "message": f"Claim cites mixed evidence units including restricted units.",
                    "location": f"claim:{cid}",
                })

        # Check for [REDACTED:...] markers (WARN)
        if "[REDACTED:" in combined_text:
            findings.append({
                "severity": "warn",
                "category": "Redaction Placeholder",
                "message": "Claim contains redacted placeholder token.",
                "location": f"claim:{cid}",
            })

        # Check unresolved conflicts or missing status (WARN)
        if cstatus == "conflicting":
            findings.append({
                "severity": "warn",
                "category": "Unresolved Conflict",
                "message": "Claim remains marked conflicting and may confuse the successor.",
                "location": f"claim:{cid}",
            })
        elif cstatus == "missing":
            findings.append({
                "severity": "warn",
                "category": "Missing Evidence",
                "message": "Claim has identified knowledge gap lacking documentary evidence.",
                "location": f"claim:{cid}",
            })

        # Single evidence citation (INFO)
        if len(evidence_ids) == 1:
            findings.append({
                "severity": "info",
                "category": "Single Evidence Citation",
                "message": f"Claim verified by a single evidence citation ({evidence_ids[0]}).",
                "location": f"claim:{cid}",
            })

    # 2. Audit Plan Items
    for item in plan_items:
        item_id = item.get("id", "unknown")
        cited_cids = item.get("claim_ids") or []
        item_title = item.get("title", "")
        item_why = item.get("why_it_matters", "")
        combined_item = f"{item_title} {item_why}"

        # Canary check on plan item
        for canary in CANARY_STRINGS:
            if canary in combined_item:
                findings.append({
                    "severity": "block",
                    "category": "Canary Leak in Plan",
                    "message": "Canary string detected in plan item text.",
                    "location": f"plan_item:{item_id}",
                })

        # Check if plan item cites a claim that is hidden from successor (WARN)
        for cid in cited_cids:
            if cid in hidden_claim_ids:
                findings.append({
                    "severity": "warn",
                    "category": "Cites Restricted Claim",
                    "message": f"Plan item cites claim {cid} which is hidden from successor clearance.",
                    "location": f"plan_item:{item_id}",
                })

    # 3. Informational Summary Findings
    hidden_level_2_count = sum(1 for c in claims if c.get("access_level") == 2)
    hidden_level_3_count = sum(1 for c in claims if c.get("access_level") == 3)

    if hidden_level_2_count > 0:
        findings.append({
            "severity": "info",
            "category": "Clearance Isolation",
            "message": f"{hidden_level_2_count} Lead-only (Level 2) items will be filtered from successor view.",
            "location": "handover:clearance_filter",
        })

    if hidden_level_3_count > 0:
        findings.append({
            "severity": "info",
            "category": "Confidential Isolation",
            "message": f"{hidden_level_3_count} Confidential (Level 3) items will be omitted completely.",
            "location": "handover:confidential_filter",
        })

    has_blockers = any(f["severity"] == "block" for f in findings)
    can_publish = not has_blockers

    return can_publish, findings
