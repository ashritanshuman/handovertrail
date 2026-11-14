import os
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models import (
    User,
    Project,
    EvidenceUnit,
    Claim,
    Question,
    HandoverVersion,
    AuditLog,
    ExtractionRun,
    ConflictGroup,
    HandoverPlan,
    PlanProgress,
)
from app.services.ingest import ingest_demo_data
from app.services.extract import extract_claims_from_units
from app.services.gaps import identify_knowledge_gaps
from app.services.conflicts import sync_conflict_groups
from app.security import SEEDED_USERS


def seed_database(db: Session, force_reset: bool = True) -> dict:
    """
    Clears existing records and seeds the full synthetic CampusConnect project,
    users, evidence units, claims, and open knowledge gaps.
    Idempotent and resets cleanly.
    """
    if force_reset:
        db.query(PlanProgress).delete()
        db.query(HandoverPlan).delete()
        db.query(AuditLog).delete()
        db.query(Question).delete()
        db.query(ConflictGroup).delete()
        db.query(Claim).delete()
        db.query(EvidenceUnit).delete()
        db.query(HandoverVersion).delete()
        db.query(ExtractionRun).delete()
        db.query(Project).delete()
        db.query(User).delete()
        db.commit()

    # 1. Seed Users
    for user_data in SEEDED_USERS.values():
        existing = db.query(User).filter(User.id == user_data["id"]).first()
        if not existing:
            user = User(
                id=user_data["id"],
                name=user_data["name"],
                role=user_data["role"],
                clearance=user_data["clearance"],
                email=user_data["email"],
            )
            db.add(user)
    db.commit()

    # 2. Seed Project
    project = db.query(Project).filter(Project.id == "campusconnect").first()
    if not project:
        project = Project(
            id="campusconnect",
            name="CampusConnect",
            description="Campus student event discovery and ticketing platform.",
            repo_url="https://github.com/campusconnect/core",
            created_at=datetime(2026, 9, 1, 9, 0, 0, tzinfo=timezone.utc),
        )
        db.add(project)
        db.commit()

    # 3. Ingest Demo Evidence Units
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    demo_dir = os.path.join(base_dir, "data", "demo")

    if not os.path.exists(demo_dir):
        demo_dir = os.path.join(os.path.dirname(__file__), "demo")
    if not os.path.exists(demo_dir):
        demo_dir = os.path.join(os.getcwd(), "data", "demo")

    raw_units = ingest_demo_data(demo_dir)
    ev_models = []
    for raw in raw_units:
        ts_str = raw.get("timestamp")
        try:
            ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00")) if ts_str else datetime.now(timezone.utc)
        except Exception:
            ts = datetime.now(timezone.utc)

        unit = EvidenceUnit(
            id=raw["id"],
            project_id="campusconnect",
            source_type=raw.get("source_type", "github"),
            source_ref=raw.get("source_ref", ""),
            location=raw.get("location", ""),
            author=raw.get("author", "Team"),
            timestamp=ts,
            text=raw.get("text", ""),
            access_level=int(raw.get("access_level", 1)),
            redactions_json=raw.get("redactions_json", []),
        )
        ev_models.append(unit)
        db.merge(unit)
    db.commit()

    # 4. Seed Extracted Claims
    claims_data, origin = extract_claims_from_units(raw_units, use_cache=True)
    for c in claims_data:
        claim_obj = Claim(
            id=c["id"],
            project_id="campusconnect",
            type=c["type"],
            text=c["text"],
            owner=c["owner"],
            status=c["status"],
            evidence_ids=c["evidence_ids"],
            quote=c.get("quote", ""),
            access_level=c.get("access_level", 1),
            review_state=c.get("review_state", "draft"),
            version=c.get("version", 1),
            origin=c.get("origin", "cache"),
            conflict_group_id=c.get("conflict_group_id"),
        )
        db.merge(claim_obj)
    db.commit()

    # 5. Seed Knowledge Gaps
    gaps_data = identify_knowledge_gaps(raw_units)
    for g in gaps_data:
        q_obj = Question(
            id=g["id"],
            claim_id=g.get("claim_id"),
            conflict_group_id=g.get("conflict_group_id"),
            kind=g.get("kind", "conflict"),
            text=g["text"],
            state=g.get("state", "open"),
            asked_by=g.get("asked_by", "system"),
            created_at=datetime.now(timezone.utc),
        )
        db.merge(q_obj)
    db.commit()

    # 5b. Sync Conflict Groups
    conflict_groups = sync_conflict_groups(db, "campusconnect")

    # Record initial extraction run
    run = ExtractionRun(
        id=f"run-{uuid.uuid4().hex[:12]}",
        origin="cache",
        started_at=datetime.now(timezone.utc),
        finished_at=datetime.now(timezone.utc),
        counts_json={"claims": len(claims_data), "units": len(ev_models)},
    )
    db.add(run)

    # 6. Audit Log Entry
    audit = AuditLog(
        id=f"aud-{uuid.uuid4().hex[:12]}",
        actor="maya",
        action="LOAD_DEMO",
        entity="project",
        entity_id="campusconnect",
        details=f"Loaded {len(ev_models)} evidence units, {len(claims_data)} claims, {len(gaps_data)} gaps, {len(conflict_groups)} conflicts.",
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "project_id": "campusconnect",
        "evidence_count": len(ev_models),
        "claims_loaded": len(claims_data),
        "gaps_loaded": len(gaps_data),
        "conflicts_loaded": len(conflict_groups),
        "message": "CampusConnect synthetic dataset loaded successfully with planted conflicts, secrets, and orphan tasks.",
    }
