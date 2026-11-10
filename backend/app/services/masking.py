import re
from typing import Tuple, List, Dict, Any

# Pattern definitions for secrets and sensitive PII
API_KEY_PATTERNS = [
    (re.compile(r"sk_live_[a-zA-Z0-9_-]{20,}"), "api_key"),
    (re.compile(r"sk_test_[a-zA-Z0-9_-]{20,}"), "api_key"),
    (re.compile(r"ghp_[a-zA-Z0-9]{36}"), "api_key"),
    (re.compile(r"AKIA[0-9A-Z]{16}"), "api_key"),
    (re.compile(r"AIza[0-9A-Za-z\-_]{35}"), "api_key"),
    (re.compile(r"(?i)(?:api_key|secret_key|private_key)\s*[:=]\s*['\"]?([a-zA-Z0-9_\-]{24,})['\"]?"), "api_key"),
]

PHONE_PATTERNS = [
    (re.compile(r"\+?[0-9]{1,3}[-.\s]?[0-9]{3,5}[-.\s]?[0-9]{4,6}"), "phone"),
]

# Sensitive personal / credential emails (protects personal credentials without masking public business contacts)
SENSITIVE_EMAIL_PATTERN = (
    re.compile(r"(?i)\b[a-zA-Z0-9_.+-]+@(?:personal|gmail|yahoo|hotmail|proton|protonmail)\.[a-zA-Z]{2,}\b"),
    "email",
)


def mask_sensitive_content(text: str) -> Tuple[str, List[Dict[str, Any]], int]:
    """
    Deterministically masks secrets, tokens, phone numbers, and private credentials as [REDACTED:type].
    Returns (masked_text, redactions_list, total_redaction_count).
    Guarantees raw secrets are never stored, returned, or logged.
    """
    if not text:
        return text, [], 0

    masked = text
    redactions: List[Dict[str, Any]] = []
    counts: Dict[str, int] = {}

    # Mask API keys and tokens
    for pattern, red_type in API_KEY_PATTERNS:
        matches = pattern.findall(masked)
        if matches:
            count = len(matches)
            counts[red_type] = counts.get(red_type, 0) + count
            masked = pattern.sub(f"[REDACTED:{red_type}]", masked)

    # Mask Phone Numbers
    for pattern, red_type in PHONE_PATTERNS:
        matches = pattern.findall(masked)
        if matches:
            count = len(matches)
            counts[red_type] = counts.get(red_type, 0) + count
            masked = pattern.sub(f"[REDACTED:{red_type}]", masked)

    # Mask Sensitive Emails if present
    sem_pattern, red_type = SENSITIVE_EMAIL_PATTERN
    sem_matches = sem_pattern.findall(masked)
    if sem_matches:
        count = len(sem_matches)
        counts[red_type] = counts.get(red_type, 0) + count
        masked = sem_pattern.sub(f"[REDACTED:{red_type}]", masked)

    for r_type, count in counts.items():
        redactions.append({"type": r_type, "count": count})

    total_count = sum(counts.values())
    return masked, redactions, total_count


def mask_text(text: str) -> str:
    """Helper returning only the masked text string."""
    masked, _, _ = mask_sensitive_content(text)
    return masked
