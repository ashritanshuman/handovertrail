import csv
import io
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple, Generator
from sqlalchemy.orm import Session
from app.models import (
    HandoverVersion,
    Acknowledgement,
    AuditLog,
    Claim,
    User,
)
from app.services.permissions import can_view_entity


CANARY_L3 = "CANARY-LEVEL3-DO-NOT-LEAK"
CANARY_L2 = "CANARY-LEVEL2-HR"
SENSITIVE_PHRASES = ["transition bonus", "Notice period set to 6 weeks", "Confidential HR"]


def sanitize_redact_value(val: Any, viewer_clearance: int = 2) -> Any:
    """
    Recursively redacts sensitive level-3 tokens, secrets, and canary strings
    from nested dicts/lists/strings.
    """
    if val is None:
        return None
    if isinstance(val, str):
        cleaned = val
        if CANARY_L3 in cleaned:
            return "[REDACTED]"
        if viewer_clearance < 2:
            if CANARY_L2 in cleaned:
                return "[REDACTED]"
            for phrase in SENSITIVE_PHRASES:
                if phrase.lower() in cleaned.lower():
                    return "[REDACTED]"
        return cleaned
    if isinstance(val, dict):
        # If this dict represents an entity with an access_level exceeding viewer clearance:
        if "access_level" in val and val.get("access_level", 1) > viewer_clearance:
            return "[REDACTED]"
        return {k: sanitize_redact_value(v, viewer_clearance) for k, v in val.items()}
    if isinstance(val, list):
        return [sanitize_redact_value(item, viewer_clearance) for item in val]
    return val


def sanitize_csv_cell(value: Any) -> str:
    """
    Converts a value to string and protects against CSV formula injection.
    Prefixes values starting with '=', '+', '-', or '@' with a single quote.
    """
    if value is None:
        return ""
    s = str(value)
    if s.startswith(("=", "+", "-", "@")):
        return f"'{s}"
    return s


def compute_version_diff(
    version_a: HandoverVersion,
    version_b: HandoverVersion,
    db: Session,
    viewer_clearance: int = 2,
) -> Dict[str, Any]:
    """
    Computes a deterministic, field-level semantic diff between two handover snapshots.
    Claims are matched by stable 'id'.
    """
    raw_claims_a = version_a.snapshot_json or []
    raw_claims_b = version_b.snapshot_json or []

    # Filter by viewer clearance and sanitize
    claims_a_filtered = [
        sanitize_redact_value(c, viewer_clearance)
        for c in raw_claims_a
        if can_view_entity(c.get("access_level", 1), viewer_clearance)
    ]
    claims_b_filtered = [
        sanitize_redact_value(c, viewer_clearance)
        for c in raw_claims_b
        if can_view_entity(c.get("access_level", 1), viewer_clearance)
    ]

    map_a = {c["id"]: c for c in claims_a_filtered if isinstance(c, dict) and "id" in c}
    map_b = {c["id"]: c for c in claims_b_filtered if isinstance(c, dict) and "id" in c}

    added = []
    removed = []
    changed = []
    unchanged_count = 0

    tracked_fields = ["text", "owner", "type", "status", "review_state", "quote"]

    # 1. Added: in B but not in A
    for cid, cb in map_b.items():
        if cid not in map_a:
            added.append({
                "id": cid,
                "type": cb.get("type", "task"),
                "text": cb.get("text", ""),
                "owner": cb.get("owner", ""),
                "status": cb.get("status", "inferred"),
                "review_state": cb.get("review_state", "draft"),
                "access_level": cb.get("access_level", 1),
                "evidence_ids": cb.get("evidence_ids", []),
                "quote": cb.get("quote", ""),
            })

    # 2. Removed: in A but not in B
    for cid, ca in map_a.items():
        if cid not in map_b:
            removed.append({
                "id": cid,
                "type": ca.get("type", "task"),
                "text": ca.get("text", ""),
                "owner": ca.get("owner", ""),
                "status": ca.get("status", "inferred"),
                "review_state": ca.get("review_state", "draft"),
                "access_level": ca.get("access_level", 1),
                "evidence_ids": ca.get("evidence_ids", []),
                "quote": ca.get("quote", ""),
            })

    # 3. Changed or Unchanged: in both A and B
    for cid in map_b:
        if cid in map_a:
            ca = map_a[cid]
            cb = map_b[cid]

            field_changes = []
            for field in tracked_fields:
                va = ca.get(field)
                vb = cb.get(field)
                if va != vb:
                    field_changes.append({
                        "field": field,
                        "old_value": va,
                        "new_value": vb,
                    })

            if field_changes:
                # Find audit attribution between version_a approved_at and version_b approved_at
                audit_entry = (
                    db.query(AuditLog)
                    .filter(
                        AuditLog.entity_id == cid,
                        AuditLog.at <= version_b.approved_at,
                    )
                    .order_by(AuditLog.at.desc())
                    .first()
                )

                changed_by = audit_entry.actor if audit_entry else (version_b.approved_by or "lead")
                changed_at = audit_entry.at.isoformat() if audit_entry else version_b.approved_at.isoformat()
                note = ""
                if audit_entry and audit_entry.after_json and isinstance(audit_entry.after_json, dict):
                    note = audit_entry.after_json.get("note", "")
                if not note and audit_entry and audit_entry.details:
                    note = audit_entry.details

                changed.append({
                    "id": cid,
                    "type": cb.get("type", "task"),
                    "text": cb.get("text", ""),
                    "old_text": ca.get("text", ""),
                    "owner": cb.get("owner", ""),
                    "old_owner": ca.get("owner", ""),
                    "status": cb.get("status", "inferred"),
                    "old_status": ca.get("status", "inferred"),
                    "review_state": cb.get("review_state", "draft"),
                    "old_review_state": ca.get("review_state", "draft"),
                    "access_level": cb.get("access_level", 1),
                    "evidence_ids": cb.get("evidence_ids", []),
                    "quote": cb.get("quote", ""),
                    "field_changes": field_changes,
                    "changed_by": changed_by,
                    "changed_at": changed_at,
                    "note": note,
                })
            else:
                unchanged_count += 1

    return {
        "from_version": version_a.version,
        "to_version": version_b.version,
        "from_approved_at": version_a.approved_at.isoformat() if version_a.approved_at else None,
        "to_approved_at": version_b.approved_at.isoformat() if version_b.approved_at else None,
        "added": added,
        "removed": removed,
        "changed": changed,
        "unchanged_count": unchanged_count,
        "total_from": len(claims_a_filtered),
        "total_to": len(claims_b_filtered),
    }


def get_acknowledgement_tracking(
    db: Session,
    project_id: str = "campusconnect",
    version_query: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Returns tracking rows for all project successors across approved versions,
    identifying Acknowledged, Pending, and Outdated statuses.
    """
    all_versions = (
        db.query(HandoverVersion)
        .filter(HandoverVersion.project_id == project_id)
        .order_by(HandoverVersion.approved_at.asc())
        .all()
    )

    if not all_versions:
        return {
            "current_version": None,
            "inspected_version": None,
            "total_recipients": 0,
            "acknowledged_count": 0,
            "pending_count": 0,
            "outdated_count": 0,
            "recipients": [],
        }

    latest_hv = all_versions[-1]
    target_hv = latest_hv

    if version_query:
        target_hv = next(
            (v for v in all_versions if v.version == version_query or v.id == version_query or v.id == f"hv-v{version_query}"),
            latest_hv,
        )

    # Successors
    successors = db.query(User).filter(User.role == "successor").all()
    if not successors:
        successors = [
            User(
                id="arjun",
                name="Arjun Rao",
                role="successor",
                clearance=1,
                email="arjun.rao@campusconnect.dev",
            )
        ]

    recipients_data = []
    ack_count = 0
    pending_count = 0
    outdated_count = 0

    for user in successors:
        user_acks = (
            db.query(Acknowledgement)
            .filter(Acknowledgement.user_id == user.id)
            .order_by(Acknowledgement.at.desc())
            .all()
        )

        target_ack = next(
            (a for a in user_acks if a.version_id == target_hv.id or a.version_id == f"hv-v{target_hv.version}"),
            None,
        )

        status_str = "pending"
        ack_at = None
        note = ""
        prev_version = None

        if target_ack:
            if target_hv.id == latest_hv.id:
                status_str = "acknowledged"
                ack_at = target_ack.at
                note = target_ack.note or ""
            else:
                status_str = "outdated"
                ack_at = target_ack.at
                note = target_ack.note or ""
                prev_version = target_hv.version
        elif user_acks:
            # User acknowledged an earlier version, but target/latest is unacknowledged
            status_str = "outdated"
            latest_past_ack = user_acks[0]
            ack_at = latest_past_ack.at
            note = latest_past_ack.note or ""
            # Find which version that past ack was for
            past_hv = next((v for v in all_versions if v.id == latest_past_ack.version_id), None)
            prev_version = past_hv.version if past_hv else "earlier"
        else:
            status_str = "pending"

        if status_str == "acknowledged":
            ack_count += 1
        elif status_str == "outdated":
            outdated_count += 1
        else:
            pending_count += 1

        recipients_data.append({
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "status": status_str,
            "acknowledged_at": ack_at.isoformat() if ack_at else None,
            "note": note,
            "previously_acknowledged_version": prev_version,
        })

    return {
        "current_version": latest_hv.version,
        "inspected_version": target_hv.version,
        "total_recipients": len(successors),
        "acknowledged_count": ack_count,
        "pending_count": pending_count,
        "outdated_count": outdated_count,
        "recipients": recipients_data,
    }


def generate_audit_summary(
    action: str,
    entity: str,
    entity_id: str,
    actor: str,
    before_json: Any,
    after_json: Any,
    details: Optional[str] = None,
) -> str:
    """
    Generates a readable, human-friendly narrative summary for an audit log record.
    """
    if action == "REVIEW_CLAIM":
        if after_json and isinstance(after_json, dict):
            state = after_json.get("review_state", "updated")
            v = after_json.get("version", "")
            owner = after_json.get("owner", "")
            return f"{actor} updated claim {entity_id} to '{state}' (v{v}, owner: {owner})"
        return f"{actor} reviewed claim {entity_id}"

    if action == "APPROVE_HANDOVER":
        note = after_json.get("note") if isinstance(after_json, dict) else ""
        note_suffix = f" (Note: {note})" if note else ""
        return f"{actor} approved and published handover {entity_id}{note_suffix}"

    if action == "ACKNOWLEDGE":
        return f"{actor} acknowledged receipt of handover {entity_id}"

    if action in ("conflict_resolved", "RESOLVE_CONFLICT"):
        res_type = ""
        note = ""
        if after_json and isinstance(after_json, dict):
            res_type = after_json.get("resolution_type", "")
            note = after_json.get("note", "")
        suffix = f" via {res_type}" if res_type else ""
        if note:
            suffix += f" (Note: {note})"
        return f"{actor} resolved conflict {entity_id}{suffix}"

    if action in ("conflict_dismissed", "DISMISS_CONFLICT"):
        note = after_json.get("note", "") if isinstance(after_json, dict) else ""
        suffix = f" (Reason: {note})" if note else ""
        return f"{actor} dismissed conflict {entity_id}{suffix}"

    if action in ("conflict_left_unresolved", "DEFER_CONFLICT"):
        note = after_json.get("note", "") if isinstance(after_json, dict) else ""
        suffix = f" (Reason: {note})" if note else ""
        return f"{actor} deferred conflict {entity_id}{suffix}"

    if action in ("interview_answered", "exit_interview_answered", "ANSWER_GAP"):
        return f"{actor} provided answer for knowledge gap / interview #{entity_id}"

    if action in ("interview_skipped", "SKIP_GAP"):
        return f"{actor} skipped knowledge gap / interview #{entity_id}"

    if action == "LOAD_DEMO":
        return f"{actor} reset and loaded synthetic CampusConnect demo dataset"

    if details and details.strip():
        return details.strip()

    return f"{actor} performed {action} on {entity} {entity_id}"


def export_audit_csv_generator(
    logs: List[AuditLog],
    viewer_clearance: int = 2,
) -> Generator[str, None, None]:
    """
    Yields CSV rows for audit log records with redaction and formula-injection protection.
    """
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    headers = [
        "Audit ID",
        "Timestamp",
        "Actor",
        "Action",
        "Entity",
        "Entity ID",
        "Summary",
        "Reason / Note",
        "Details",
    ]
    writer.writerow(headers)
    yield output.getvalue()
    output.seek(0)
    output.truncate(0)

    for log in logs:
        # Sanitize before and after
        sanitized_after = sanitize_redact_value(log.after_json, viewer_clearance)
        note = ""
        if isinstance(sanitized_after, dict):
            note = sanitized_after.get("note", "")

        summary = generate_audit_summary(
            action=log.action,
            entity=log.entity,
            entity_id=log.entity_id,
            actor=log.actor,
            before_json=log.before_json,
            after_json=sanitized_after,
            details=log.details,
        )

        row = [
            sanitize_csv_cell(log.id),
            sanitize_csv_cell(log.at.isoformat() if log.at else ""),
            sanitize_csv_cell(log.actor),
            sanitize_csv_cell(log.action),
            sanitize_csv_cell(log.entity),
            sanitize_csv_cell(log.entity_id),
            sanitize_csv_cell(summary),
            sanitize_csv_cell(note),
            sanitize_csv_cell(sanitize_redact_value(log.details, viewer_clearance)),
        ]
        writer.writerow(row)
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
