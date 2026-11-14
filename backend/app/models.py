from datetime import datetime, timezone
from typing import List, Optional, Any
from sqlalchemy import (
    Column,
    String,
    Integer,
    Text,
    DateTime,
    ForeignKey,
    JSON,
    Boolean,
)
from sqlalchemy.orm import relationship, synonym
from app.db import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)  # 'riya', 'maya', 'arjun'
    name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)  # 'leaver', 'lead', 'successor'
    clearance = Column(Integer, default=1, nullable=False)  # 1 (Team), 2 (Lead), 3 (Confidential)
    email = Column(String(150), nullable=False)

    acknowledgements = relationship("Acknowledgement", back_populates="user")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(50), primary_key=True, index=True)  # 'campusconnect'
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    repo_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    evidence_units = relationship("EvidenceUnit", back_populates="project", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="project", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="project", cascade="all, delete-orphan")
    handover_versions = relationship("HandoverVersion", back_populates="project", cascade="all, delete-orphan")


class EvidenceUnit(Base):
    __tablename__ = "evidence_units"

    id = Column(String(50), primary_key=True, index=True)  # 'ev-github-001'
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=False, index=True)
    source_type = Column(String(50), nullable=False)  # 'github', 'jira', 'meeting_notes', 'slack', 'exit_interview'
    source_ref = Column(String(100), nullable=False)  # 'Issue #42', 'TASK-104', etc.
    location = Column(String(255), nullable=True)
    author = Column(String(100), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utc_now)
    text = Column(Text, nullable=False)
    access_level = Column(Integer, default=1, nullable=False)  # 1, 2, 3
    redactions_json = Column(JSON, default=list, nullable=False)  # [{"type": "api_key", "count": 1}]

    project = relationship("Project", back_populates="evidence_units")

    def __init__(self, **kwargs):
        if "redactions_json" not in kwargs:
            kwargs["redactions_json"] = []
        super().__init__(**kwargs)


class Claim(Base):
    __tablename__ = "claims"

    id = Column(String(50), primary_key=True, index=True)  # 'clm-001'
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # 'decision', 'task', 'risk', 'dependency', 'open_question', 'contact'
    text = Column(Text, nullable=False)
    owner = Column(String(100), nullable=False)
    status = Column(String(50), default="inferred", nullable=False)  # 'verified', 'inferred', 'conflicting', 'missing'
    evidence_ids = Column(JSON, default=list, nullable=False)  # List[str] e.g. ["ev-github-001"]
    quote = Column(Text, default="", nullable=False)  # Verbatim quote
    access_level = Column(Integer, default=1, nullable=False)  # 1, 2, 3
    review_state = Column(String(50), default="draft", nullable=False)  # 'draft', 'confirmed', 'rejected', 'edited'
    version = Column(Integer, default=1, nullable=False)
    origin = Column(String(20), default="llm", nullable=False)  # 'llm', 'cache', 'human'
    conflict_group_id = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    project = relationship("Project", back_populates="claims")
    questions = relationship("Question", back_populates="claim", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(50), primary_key=True, index=True)  # 'gap-001'
    project_id = Column(String(50), ForeignKey("projects.id"), default="campusconnect", nullable=False, index=True)
    claim_id = Column(String(50), ForeignKey("claims.id"), nullable=True, index=True)
    conflict_group_id = Column(String(50), nullable=True, index=True)
    kind = Column(String(50), default="conflict", nullable=False)  # 'conflict', 'missing', 'low_evidence'
    text = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    answered_by = Column(String(50), nullable=True)
    state = Column(String(50), default="open", nullable=False)  # 'open', 'answered'
    asked_by = Column(String(50), default="system", nullable=True)
    answered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    project = relationship("Project", back_populates="questions")
    claim = relationship("Claim", back_populates="questions")

    def __init__(self, **kwargs):
        if "project_id" not in kwargs:
            kwargs["project_id"] = "campusconnect"
        super().__init__(**kwargs)


class HandoverVersion(Base):
    __tablename__ = "handover_versions"

    id = Column(String(50), primary_key=True, index=True)  # 'hv-v1.0'
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=False, index=True)
    version = Column(String(20), nullable=False)  # '1.0.0'
    snapshot_json = Column(JSON, nullable=False)
    approved_by = Column(String(50), ForeignKey("users.id"), nullable=False)
    approved_at = Column(DateTime(timezone=True), default=utc_now)
    notes = Column(Text, default="", nullable=True)

    project = relationship("Project", back_populates="handover_versions")
    acknowledgements = relationship("Acknowledgement", back_populates="handover_version", cascade="all, delete-orphan")


class Acknowledgement(Base):
    __tablename__ = "acknowledgements"

    id = Column(String(50), primary_key=True, index=True)
    version_id = Column(String(50), ForeignKey("handover_versions.id"), nullable=False, index=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False, index=True)
    at = Column(DateTime(timezone=True), default=utc_now)
    note = Column(Text, default="", nullable=True)

    handover_version = relationship("HandoverVersion", back_populates="acknowledgements")
    user = relationship("User", back_populates="acknowledgements")

    # SQLAlchemy synonyms so queries and models support both styles
    handover_version_id = synonym("version_id")
    acknowledged_at = synonym("at")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String(50), primary_key=True, index=True)
    actor = Column(String(50), nullable=False)  # User ID who triggered action
    action = Column(String(100), nullable=False)  # 'LOAD_DEMO', 'EXTRACT_CLAIMS', 'REVIEW_CLAIM', etc.
    entity = Column(String(50), nullable=False)  # 'claim', 'handover', 'gap', 'project'
    entity_id = Column(String(100), nullable=False)
    before_json = Column(JSON, nullable=True)
    after_json = Column(JSON, nullable=True)
    at = Column(DateTime(timezone=True), default=utc_now)
    details = Column(Text, default="", nullable=True)

    # SQLAlchemy synonyms so queries and models support both styles
    user_id = synonym("actor")
    target_type = synonym("entity")
    target_id = synonym("entity_id")
    timestamp = synonym("at")


class ExtractionRun(Base):
    __tablename__ = "extraction_runs"

    id = Column(String(50), primary_key=True, index=True)
    started_at = Column(DateTime(timezone=True), default=utc_now)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    origin = Column(String(20), default="cache", nullable=False)  # 'llm', 'cache'
    counts_json = Column(JSON, nullable=True)
    error = Column(Text, nullable=True)


class ConflictGroup(Base):
    __tablename__ = "conflict_groups"

    id = Column(String(50), primary_key=True, index=True)  # 'cg-api-key-rotation'
    project_id = Column(String(50), ForeignKey("projects.id"), default="campusconnect", nullable=False, index=True)
    topic = Column(String(150), nullable=True, index=True)  # Groups related conflicts
    attribute = Column(String(50), nullable=False)  # 'period', 'owner', 'date', 'status', 'tool_choice'
    entity = Column(String(150), nullable=False)  # e.g. 'API Key Rotation', 'Payment Recon'
    type = Column(String(50), default="contradiction", nullable=False)  # 'contradiction', 'supersession'
    confidence = Column(String(20), default="high", nullable=False)  # 'high', 'medium', 'low'
    status = Column(String(30), default="open", nullable=False)  # 'open', 'resolved', 'dismissed', 'unresolved'
    resolution_type = Column(String(30), nullable=True)  # 'chose_claim', 'corrected', 'dismissed', 'left_unresolved'
    resolved_claim_id = Column(String(50), nullable=True)
    note = Column(Text, nullable=True)  # Lead explanation / reason
    suggestion = Column(Text, nullable=True)  # Auto-generated supersession / resolution hint
    resolved_by = Column(String(50), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    def __init__(self, **kwargs):
        if "project_id" not in kwargs:
            kwargs["project_id"] = "campusconnect"
        super().__init__(**kwargs)


class HandoverPlan(Base):
    __tablename__ = "handover_plans"

    id = Column(String(50), primary_key=True, index=True)  # 'plan-campusconnect-v1.0'
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=False, index=True)
    version_id = Column(String(50), ForeignKey("handover_versions.id"), nullable=True, index=True)
    status = Column(String(20), default="draft", nullable=False)  # 'draft', 'published'
    role_title = Column(String(100), default="Software Engineer", nullable=False)
    focus_areas = Column(JSON, default=list, nullable=False)  # e.g. ["Backend", "Payments", "Vault"]
    items_json = Column(JSON, default=list, nullable=False)
    generated_at = Column(DateTime(timezone=True), default=utc_now)
    generated_by = Column(String(50), ForeignKey("users.id"), nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project")
    handover_version = relationship("HandoverVersion")
    progress_records = relationship("PlanProgress", back_populates="plan", cascade="all, delete-orphan")


class PlanProgress(Base):
    __tablename__ = "plan_progress"

    id = Column(String(50), primary_key=True, index=True)  # 'prog-<plan_id>-<item_id>-<user_id>'
    plan_id = Column(String(50), ForeignKey("handover_plans.id"), nullable=False, index=True)
    item_id = Column(String(50), nullable=False, index=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False, index=True)
    done = Column(Boolean, default=False, nullable=False)
    at = Column(DateTime(timezone=True), default=utc_now)

    plan = relationship("HandoverPlan", back_populates="progress_records")
    user = relationship("User")


