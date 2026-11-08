import re
from typing import List, Tuple, Optional


def normalize_text(text: str) -> str:
    """Normalizes whitespace and common punctuation for robust matching."""
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text)
    return text.strip().lower()


def verify_quote_against_evidence(quote: str, evidence_texts: List[str]) -> Tuple[bool, Optional[str]]:
    """
    Deterministic check: Returns True if quote is contained verbatim in any evidence text.
    """
    if not quote or not quote.strip():
        return False, None
    
    norm_quote = normalize_text(quote)
    for ev_text in evidence_texts:
        norm_ev = normalize_text(ev_text)
        if norm_quote in norm_ev:
            return True, ev_text
            
    return False, None

