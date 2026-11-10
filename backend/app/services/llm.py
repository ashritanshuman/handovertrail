import abc
import hashlib
import json
import os
import time
from typing import List, Optional
from pydantic import BaseModel, Field


class ClaimDraft(BaseModel):
    type: str = Field(..., description="One of: decision, task, risk, dependency, open_question, contact")
    text: str = Field(..., description="Fact-focused claim statement derived strictly from evidence")
    owner: str = Field(..., description="Explicitly mentioned owner or 'Unassigned'")
    quote: str = Field(..., description="Verbatim source quote supporting this claim")
    evidence_ids: List[str] = Field(..., description="IDs of cited evidence units")


class ClaimsExtractionResponse(BaseModel):
    claims: List[ClaimDraft] = Field(default_factory=list)


class BaseLLMClient(abc.ABC):
    @abc.abstractmethod
    def extract_claims(self, chunk: List[dict]) -> List[ClaimDraft]:
        """Extract claims from a chunk of evidence units."""
        pass


class FakeLLMClient(BaseLLMClient):
    """
    Deterministic offline client reading from fixtures/claims_cache.json.
    Runs without network or API keys.
    """
    def __init__(self, cache_file_path: Optional[str] = None):
        if cache_file_path is None:
            base_dir = os.path.dirname(os.path.dirname(__file__))
            cache_file_path = os.path.join(base_dir, "fixtures", "claims_cache.json")
        self.cache_file_path = cache_file_path

    def extract_claims(self, chunk: List[dict]) -> List[ClaimDraft]:
        if not os.path.exists(self.cache_file_path):
            return []
        try:
            with open(self.cache_file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Match claims that cite evidence IDs in this chunk
            chunk_ev_ids = {u["id"] for u in chunk if "id" in u}
            matched: List[ClaimDraft] = []
            for item in data:
                c_ev_ids = set(item.get("evidence_ids", []))
                if not chunk_ev_ids or (c_ev_ids & chunk_ev_ids):
                    matched.append(
                        ClaimDraft(
                            type=item.get("type", "decision"),
                            text=item.get("text", ""),
                            owner=item.get("owner", "Unassigned"),
                            quote=item.get("quote", ""),
                            evidence_ids=item.get("evidence_ids", []),
                        )
                    )
            return matched
        except Exception:
            return []
