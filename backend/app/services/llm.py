import abc
import hashlib
import json
import logging
import os
import time
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.config import settings

logger = logging.getLogger("handovertrail.llm")


class ClaimDraft(BaseModel):
    type: str = Field(..., description="One of: decision, task, risk, dependency, open_question, contact")
    text: str = Field(..., description="Fact-focused claim statement derived strictly from evidence")
    owner: str = Field(..., description="Explicitly mentioned owner or 'Unassigned'")
    quote: str = Field(..., description="Verbatim source quote supporting this claim copied from one cited unit")
    evidence_ids: List[str] = Field(..., description="IDs of cited evidence units")


class ClaimsExtractionResponse(BaseModel):
    claims: List[ClaimDraft] = Field(default_factory=list)


SYSTEM_PROMPT = """You are an evidence extraction engine for an engineering handover platform.
Extract high-value handover claims (decisions, tasks, risks, dependencies, open questions, contacts) from the provided evidence.

CRITICAL RULES:
1. Use ONLY the provided evidence. NEVER assume or hallucinate facts that are not explicitly stated.
2. Return FEWER claims when unsure. Quality and truthfulness over quantity.
3. Every claim MUST cite one or more evidence IDs from the chunk, and MUST include an exact verbatim quote copied from one cited unit.
4. If no owner is explicitly stated in the evidence, set owner to "Unassigned".
5. Return JSON adhering to the specified schema."""


class BaseLLMClient(abc.ABC):
    @abc.abstractmethod
    def extract_claims(self, chunk: List[Dict[str, Any]]) -> List[ClaimDraft]:
        """Extract claims from a chunk of evidence units."""
        pass


class FakeLLMClient(BaseLLMClient):
    """
    Deterministic offline client that reads from fixtures/claims_cache.json.
    Used when GEMINI_API_KEY is not set or in test environments.
    """
    def __init__(self, cache_file_path: Optional[str] = None):
        if cache_file_path is None:
            base_dir = os.path.dirname(os.path.dirname(__file__))
            cache_file_path = os.path.join(base_dir, "fixtures", "claims_cache.json")
        self.cache_file_path = cache_file_path

    def extract_claims(self, chunk: List[Dict[str, Any]]) -> List[ClaimDraft]:
        if not os.path.exists(self.cache_file_path):
            return []
        try:
            with open(self.cache_file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            chunk_ev_ids = {u["id"] for u in chunk if "id" in u}
            matched: List[ClaimDraft] = []
            for item in data:
                c_ev_ids = set(item.get("evidence_ids", []))
                # Match if chunk contains cited evidence or if chunk covers the whole set
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
        except Exception as e:
            logger.warning(f"Error reading FakeLLMClient cache: {e}")
            return []


class GeminiLLMClient(BaseLLMClient):
    """
    Official Google Gemini API client via google-genai SDK.
    Supports structured JSON schema outputs, on-disk hashing cache, exponential backoff, and retry.
    """
    def __init__(self, api_key: str, model_name: Optional[str] = None):
        from google import genai
        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name or settings.LLM_MODEL
        self.cache_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "fixtures", "llm_cache")
        os.makedirs(self.cache_dir, exist_ok=True)

    def _compute_cache_key(self, chunk: List[Dict[str, Any]]) -> str:
        # Keyed by hash of model, prompt, and chunk
        serialized = json.dumps(chunk, sort_keys=True)
        h = hashlib.sha256(f"{self.model_name}:{SYSTEM_PROMPT}:{serialized}".encode("utf-8")).hexdigest()
        return h

    def extract_claims(self, chunk: List[Dict[str, Any]]) -> List[ClaimDraft]:
        cache_key = self._compute_cache_key(chunk)
        cache_file = os.path.join(self.cache_dir, f"{cache_key}.json")

        if os.path.exists(cache_file):
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)
                return [ClaimDraft(**c) for c in cached_data]
            except Exception as e:
                logger.warning(f"Disk cache read failed, falling back to API: {e}")

        prompt = f"Evidence units:\n{json.dumps(chunk, indent=2)}\n\nExtract all verifiable handover claims."

        from google.genai import types

        max_attempts = 2
        for attempt in range(max_attempts):
            try:
                config = types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.1,
                    response_mime_type="application/json",
                    response_schema=ClaimsExtractionResponse,
                )
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=config,
                )

                parsed = ClaimsExtractionResponse.model_validate_json(response.text)
                claims = parsed.claims

                # Write to disk cache
                try:
                    with open(cache_file, "w", encoding="utf-8") as f:
                        json.dump([c.model_dump() for c in claims], f)
                except Exception as e:
                    logger.warning(f"Failed to write disk cache: {e}")

                return claims
            except Exception as e:
                err_str = str(e)
                logger.warning(f"Gemini API attempt {attempt+1} failed: {type(e).__name__} {err_str[:120]}")
                if "429" in err_str or "503" in err_str:
                    time.sleep(2 ** (attempt + 1))
                elif attempt < max_attempts - 1:
                    time.sleep(1)
                else:
                    raise e
        return []


def get_llm_client() -> BaseLLMClient:
    """Returns GeminiLLMClient if GEMINI_API_KEY is configured, else FakeLLMClient."""
    key = settings.GEMINI_API_KEY
    if key and key.strip():
        try:
            return GeminiLLMClient(api_key=key.strip(), model_name=settings.LLM_MODEL)
        except Exception as e:
            logger.warning(f"Failed to initialize GeminiLLMClient, falling back to FakeLLMClient: {e}")
    return FakeLLMClient()
