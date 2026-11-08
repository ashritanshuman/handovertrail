from datetime import datetime, timezone
import json
from typing import List, Optional
from sqlalchemy import (
    Column,
    String,
    Integer,
    Text,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
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
    handover_versions = relationship("HandoverVersion", back_populates="project", cascade="all, delete-orphan")


class EvidenceUnit(Base):
    __tablename__ = "evidence_units"

    id = Column(String(50), primary_key=True, index=True)  # 'ev-github-001'
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=False, index=True)
    source_type = Column(String(50), nullable=False)  # 'github', 'jira', 'meeting_notes', 'slack'
    source_ref = Column(String(100), nullable=False)  # 'Issue #42', 'TASK-104', etc.
    location = Column(String(255), nullable=True)
    author = Column(String(100), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utc_now)
    text = Column(Text, nullable=False)
    access_level = Column(Integer, default=1, nullable=False)  # 1, 2, 3

    project = relationship("Project", back_populates="evidence_units")


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

    project = relationship("Project", back_populates="claims")
    questions = relationship("Question", back_populates="claim", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(50), primary_key=True, index=True)  # 'gap-001'
    claim_id = Column(String(50), ForeignKey("claims.id"), nullable=True, index=True)
    text = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    state = Column(String(50), default="open", nullable=False)  # 'open', 'answered', 'dismissed'
    asked_by = Column(String(50), default="system", nullable=False)
    answered_by = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    answered_at = Column(DateTime(timezone=True), nullable=True)

    claim = relationship("Claim", back_populates="questions")


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
    handover_version_id = Column(String(50), ForeignKey("handover_versions.id"), nullable=False, index=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False, index=True)
    acknowledged_at = Column(DateTime(timezone=True), default=utc_now)
    note = Column(Text, default="", nullable=True)

    handover_version = relationship("HandoverVersion", back_populates="acknowledgements")
    user = relationship("User", back_populates="acknowledgements")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)  # 'LOAD_DEMO', 'EXTRACT_CLAIMS', 'REVIEW_CLAIM', etc.
    target_type = Column(String(50), nullable=False)  # 'claim', 'handover', 'gap', 'project'
    target_id = Column(String(100), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utc_now)
    details = Column(Text, default="", nullable=True)
