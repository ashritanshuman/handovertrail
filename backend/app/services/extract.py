import os
import json
import logging
import uuid
from typing import List, Dict, Any, Tuple
from datetime import datetime, timezone
from app.config import settings
from app.services.verify import determine_claim_verification
from app.services.conflicts import detect_conflicts
from app.services.llm import get_llm_client, FakeLLMClient

logger = logging.getLogger("handovertrail.extract")


def load_cached_claims() -> List[Dict[str, Any]]:
    """Loads claims from fixtures/claims_cache.json."""
    cache_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "fixtures", "claims_cache.json")
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Error reading claims_cache.json: {e}")
    return []


def chunk_evidence_units(units: List[Dict[str, Any]], chunk_size: int = 12) -> List[List[Dict[str, Any]]]:
    """Groups evidence units into chunks of related units, capped at 5 chunks."""
    # Sort or group by source_type
    sorted_units = sorted(units, key=lambda u: u.get("source_type", ""))
    chunks = [sorted_units[i:i + chunk_size] for i in range(0, len(sorted_units), chunk_size)]
    return chunks[:5]  # Hard cap on chunks per run


def extract_claims_from_units(
    evidence_units: List[Dict[str, Any]],
    use_cache: bool = True,
    caller_clearance: int = 2,
) -> Tuple[List[Dict[str, Any]], str]:
    """
    Extracts structured claims from raw evidence units.
    Selects units <= caller_clearance.
    Uses Gemini API when GEMINI_API_KEY is configured and use_cache=False,
    otherwise falls back to fixtures/claims_cache.json.
    Returns (claims_list, origin ["llm" | "cache"]).
    Never crashes the request.
    """
    origin = "cache"
    ev_by_id = {u["id"]: u for u in evidence_units}

    if not use_cache and settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        try:
            llm_client = get_llm_client()
            if not isinstance(llm_client, FakeLLMClient):
                chunks = chunk_evidence_units(evidence_units)
                all_drafts = []
                for chunk in chunks:
                    drafts = llm_client.extract_claims(chunk)
                    all_drafts.extend(drafts)

                if all_drafts:
                    extracted = []
                    for idx, d in enumerate(all_drafts):
                        cid = f"clm-live-{idx+1:03d}"
                        cited = [ev_by_id[eid] for eid in d.evidence_ids if eid in ev_by_id]
                        status, level = determine_claim_verification(
                            claim_type=d.type,
                            claim_text=d.text,
                            quote=d.quote,
                            cited_units=cited,
                        )
                        if level <= caller_clearance:
                            extracted.append({
                                "id": cid,
                                "type": d.type,
                                "text": d.text,
                                "owner": d.owner,
                                "status": status,
                                "evidence_ids": d.evidence_ids,
                                "quote": d.quote,
                                "access_level": level,
                                "review_state": "draft",
                                "version": 1,
                                "origin": "llm",
                            })
                    if extracted:
                        origin = "llm"
                        extracted = detect_conflicts(extracted)
                        return extracted, origin
        except Exception as e:
            logger.warning(f"Live Gemini extraction failed or rate-limited ({e}), falling back to cache fixture.")

    # Fallback to offline claims_cache.json fixture
    cached_data = load_cached_claims()
    extracted_claims = []
    for item in cached_data:
        c = dict(item)
        c["origin"] = "cache"
        cited = [ev_by_id[eid] for eid in c.get("evidence_ids", []) if eid in ev_by_id]
        status, level = determine_claim_verification(
            claim_type=c.get("type", "decision"),
            claim_text=c.get("text", ""),
            quote=c.get("quote", ""),
            cited_units=cited if cited else [c],  # fallback if evidence not loaded
        )
        if c.get("status") != "conflicting":
            c["status"] = status
        c["access_level"] = c.get("access_level", level)

        # Only include claims within caller's clearance
        if c["access_level"] <= caller_clearance:
            extracted_claims.append(c)

    extracted_claims = detect_conflicts(extracted_claims)
    return extracted_claims, "cache"
