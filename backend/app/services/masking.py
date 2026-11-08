import re

API_KEY_PATTERN = re.compile(r"sk_live_[a-zA-Z0-9_-]{20,}")
PHONE_PATTERN = re.compile(r"\+?[0-9]{1,3}[-.\s]?[0-9]{3,5}[-.\s]?[0-9]{4,6}")


def mask_sensitive_content(text: str) -> str:
    """
    Deterministically masks Level 3 secrets and PII (API keys, phone numbers).
    """
    if not text:
        return text
    
    masked = API_KEY_PATTERN.sub("[REDACTED_API_KEY]", text)
    masked = PHONE_PATTERN.sub("[REDACTED_PHONE]", masked)
    return masked

