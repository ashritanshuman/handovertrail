from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict


# ------------------ ENUMS / LITERALS ------------------
ClaimType = Literal["decision", "task", "risk", "dependency", "open_question", "contact"]
ClaimStatus = Literal["verified", "inferred", "conflicting", "missing"]
ReviewState = Literal["draft", "confirmed", "rejected", "edited"]
HandoverState = Literal["draft", "in_review", "approved"]
ClaimOrigin = Literal["llm", "cache", "human"]
UserRole = Literal["leaver", "lead", "successor"]


# ------------------ USER ------------------
class UserBase(BaseModel):
    id: str
    name: str
    role: UserRole
    clearance: int
    email: str


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)


# ------------------ PROJECT ------------------
class ProjectBase(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    repo_url: Optional[str] = None


class ProjectRead(ProjectBase):
    handover_state: HandoverState = "draft"
    leaver: Optional[UserRead] = None
    lead: Optional[UserRead] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ------------------ EVIDENCE UNIT ------------------
class EvidenceUnitBase(BaseModel):
    id: str
    project_id: str
    source_type: str
    source_ref: str
    location: Optional[str] = None
    author: str
    timestamp: datetime
    text: str
    access_level: int = 1


class EvidenceUnitRead(EvidenceUnitBase):
    model_config = ConfigDict(from_attributes=True)


# ------------------ CLAIM ------------------
class ConflictDetail(BaseModel):
    statement_a: str
    statement_b: str


class ClaimBase(BaseModel):
    type: ClaimType
    text: str
    owner: str
    status: ClaimStatus = "inferred"
    evidence_ids: List[str] = Field(default_factory=list)
    quote: str = ""
    access_level: int = 1
    review_state: ReviewState = "draft"
    version: int = 1
    origin: ClaimOrigin = "llm"


class ClaimRead(ClaimBase):
    id: str
    project_id: str
    conflict_details: Optional[ConflictDetail] = None

    model_config = ConfigDict(from_attributes=True)


class ClaimDetail(ClaimRead):
    supporting_evidence: List[EvidenceUnitRead] = Field(default_factory=list)


class ClaimPatchRequest(BaseModel):
    review_state: Optional[ReviewState] = None
    text: Optional[str] = None
    quote: Optional[str] = None
    owner: Optional[str] = None
    type: Optional[ClaimType] = None


# ------------------ QUESTION / GAP ------------------
class QuestionBase(BaseModel):
    text: str
    claim_id: Optional[str] = None


class QuestionRead(BaseModel):
    id: str
    claim_id: Optional[str] = None
    text: str
    answer: Optional[str] = None
    state: str = "open"
    asked_by: str = "system"
    answered_by: Optional[str] = None
    created_at: datetime
    answered_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class QuestionAnswerRequest(BaseModel):
    answer: str


# ------------------ HANDOVER VERSION ------------------
class HandoverApproveRequest(BaseModel):
    project_id: str
    notes: Optional[str] = ""


class HandoverVersionRead(BaseModel):
    version: str
    project_id: str
    approved_by: str
    approved_at: datetime
    notes: Optional[str] = None
    viewer_clearance: int
    claims: List[ClaimRead]
    acknowledged: bool = False


class AcknowledgeRequest(BaseModel):
    handover_version_id: str
    note: Optional[str] = ""


# ------------------ STATS ------------------
class StatsResponse(BaseModel):
    total_claims: int
    by_status: Dict[str, int]
    by_type: Dict[str, int]
    by_review_state: Dict[str, int]
    open_gaps_count: int
    readiness_percentage: float
    can_approve: bool


# ------------------ TIMELINE ------------------
class TimelineEvent(BaseModel):
    date: str
    title: str
    category: str
    summary: str
    source_ref: str
    access_level: int


# ------------------ AUDIT LOG ------------------
class AuditLogRead(BaseModel):
    id: str
    user_id: str
    action: str
    target_type: str
    target_id: str
    timestamp: datetime
    details: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ------------------ ASK / STRETCH Q&A ------------------
class Citation(BaseModel):
    source_ref: str
    quote: str
    access_level: int


class AskRequest(BaseModel):
    project_id: str
    question: str


class AskResponse(BaseModel):
    answer: str
    citations: List[Citation]
    confidence: str


# ------------------ DEMO & EXTRACTION ------------------
class DemoLoadRequest(BaseModel):
    force_reset: bool = True
    project_id: str = "campusconnect"


class DemoLoadResponse(BaseModel):
    status: str
    project_id: str
    evidence_count: int
    claims_loaded: int
    gaps_loaded: int
    message: str


class ExtractRequest(BaseModel):
    project_id: str = "campusconnect"
    use_cache: bool = True
    max_units: int = 60


class ExtractResponse(BaseModel):
    status: str
    extracted_count: int
    verified_count: int
    conflicting_count: int
    inferred_count: int
    missing_count: int
    duration_ms: int
