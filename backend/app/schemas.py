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
    conflict_group_id: Optional[str] = None

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
    project_id: str = "campusconnect"
    notes: Optional[str] = ""
    acknowledge_unresolved: bool = False


class HandoverVersionRead(BaseModel):
    state: str = "approved"  # 'approved' or 'not_approved'
    version: str = "1.0.0"
    project_id: str = "campusconnect"
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    notes: Optional[str] = None
    viewer_clearance: int = 1
    claims: List[ClaimRead] = Field(default_factory=list)
    sections: Optional[Dict[str, List[ClaimRead]]] = None
    first_7_days: Optional[List[str]] = None
    hidden_count: int = 0
    acknowledged: bool = False


class AcknowledgeRequest(BaseModel):
    handover_version_id: Optional[str] = None
    note: Optional[str] = ""
    notes: Optional[str] = None


# ------------------ STATS ------------------
class StatsResponse(BaseModel):
    total_claims: int
    by_status: Dict[str, int]
    by_type: Dict[str, int]
    by_review_state: Dict[str, int]
    open_gaps_count: int
    readiness_percentage: float
    can_approve: bool
    extraction_origin: Optional[str] = "cache"
    weekly_activity: Optional[Dict[str, int]] = None
    conflicts_open: int = 0
    conflicts_resolved: int = 0
    conflicts_dismissed: int = 0
    conflicts_unresolved: int = 0



# ------------------ TIMELINE ------------------
class TimelineEvent(BaseModel):
    date: str
    title: str
    category: str
    summary: str
    source_ref: str
    access_level: int
    unresolved: bool = False
    evidence_ids: List[str] = Field(default_factory=list)


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
    origin: str = "cache"


# ------------------ CONFLICTS & INTERVIEW (MEMBER 1) ------------------
ConflictStatus = Literal["open", "resolved", "dismissed", "unresolved"]
ConflictResolutionType = Literal["chose_claim", "corrected", "dismissed", "left_unresolved"]


class ConflictClaimSummary(BaseModel):
    id: str
    text: str
    quote: str
    source_ref: Optional[str] = None
    source_type: Optional[str] = None
    author: Optional[str] = None
    access_level: int = 1
    review_state: str = "draft"
    status: str = "conflicting"


class LeaverAnswerSummary(BaseModel):
    question_id: str
    answer: str
    answered_by: Optional[str] = None
    answered_at: Optional[datetime] = None


class ConflictGroupRead(BaseModel):
    id: str
    project_id: str
    topic: Optional[str] = None
    attribute: str
    entity: str
    type: str = "contradiction"
    confidence: str = "high"
    status: ConflictStatus = "open"
    resolution_type: Optional[ConflictResolutionType] = None
    resolved_claim_id: Optional[str] = None
    note: Optional[str] = None
    suggestion: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    claims: List[ConflictClaimSummary] = Field(default_factory=list)
    leaver_answer: Optional[LeaverAnswerSummary] = None

    model_config = ConfigDict(from_attributes=True)


class CorrectedClaimPayload(BaseModel):
    text: str
    quote: Optional[str] = ""
    type: ClaimType = "decision"
    owner: str = "Maya Patel"


class ConflictResolveRequest(BaseModel):
    resolution_type: Literal["chose_claim", "corrected"]
    chosen_claim_id: Optional[str] = None
    corrected_claim: Optional[CorrectedClaimPayload] = None
    note: Optional[str] = ""


class ConflictReasonRequest(BaseModel):
    reason: str


class InterviewQuoteItem(BaseModel):
    label: str
    source_ref: str
    author: str
    date: str
    quote: str


class InterviewQuestionRead(BaseModel):
    id: str
    kind: str = "conflict"
    topic: Optional[str] = None
    conflict_group_id: Optional[str] = None
    text: str
    state: str = "open"  # 'open', 'answered', 'skipped'
    quotes: List[InterviewQuoteItem] = Field(default_factory=list)
    quick_options: List[str] = Field(default_factory=list)
    answer: Optional[str] = None
    answered_at: Optional[datetime] = None


class InterviewSessionResponse(BaseModel):
    session_id: str
    leaver_name: str
    total_count: int
    answered_count: int
    skipped_count: int
    questions: List[InterviewQuestionRead] = Field(default_factory=list)


class InterviewSkipRequest(BaseModel):
    reason: Optional[str] = "I don't recall"

