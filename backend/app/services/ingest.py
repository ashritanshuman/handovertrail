import os
import json
import csv
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.services.masking import mask_sensitive_content


def parse_github_export(file_path: str) -> List[Dict[str, Any]]:
    if not os.path.exists(file_path):
        return []
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def parse_tasks_csv(file_path: str) -> List[Dict[str, Any]]:
    if not os.path.exists(file_path):
        return []
    units = []
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            units.append({
                "id": row["id"],
                "project_id": row.get("project_id", "campusconnect"),
                "source_type": "jira",
                "source_ref": row.get("source_ref", ""),
                "location": row.get("location", ""),
                "author": row.get("author", "Team"),
                "timestamp": row.get("timestamp"),
                "text": row.get("text", ""),
                "access_level": int(row.get("access_level", 1)),
            })
    return units


def parse_meeting_notes(file_path: str) -> List[Dict[str, Any]]:
    if not os.path.exists(file_path):
        return []
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    sections = content.split("## Unit ")
    units = []
    for section in sections[1:]:
        lines = section.strip().split("\n")
        header = lines[0].strip()
        unit_id = header.split(":")[0].strip()

        date = datetime.now(timezone.utc).isoformat()
        author = "Maya Patel"
        location = "Meeting Room"
        access_level = 1
        body_lines = []

        for line in lines[1:]:
            line_str = line.strip()
            if line_str.startswith("- **Date**:"):
                date = line_str.replace("- **Date**:", "").strip()
            elif line_str.startswith("- **Author**:"):
                author = line_str.replace("- **Author**:", "").strip()
            elif line_str.startswith("- **Location**:"):
                location = line_str.replace("- **Location**:", "").strip()
            elif line_str.startswith("- **Access Level**:"):
                try:
                    access_level = int(line_str.replace("- **Access Level**:", "").strip())
                except ValueError:
                    access_level = 1
            elif line_str and not line_str.startswith("---"):
                body_lines.append(line_str)

        units.append({
            "id": unit_id,
            "project_id": "campusconnect",
            "source_type": "meeting_notes",
            "source_ref": header,
            "location": location,
            "author": author,
            "timestamp": date,
            "text": " ".join(body_lines),
            "access_level": access_level,
        })
    return units


def parse_slack_export(file_path: str) -> List[Dict[str, Any]]:
    if not os.path.exists(file_path):
        return []
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def ingest_demo_data(data_dir: str) -> List[Dict[str, Any]]:
    """
    Loads all evidence units from data/demo directory.
    Masks secrets and PII before return; guarantees access_level 3 for any unit with redactions.
    """
    all_units = []
    all_units.extend(parse_github_export(os.path.join(data_dir, "github_export.json")))
    all_units.extend(parse_tasks_csv(os.path.join(data_dir, "tasks.csv")))
    all_units.extend(parse_meeting_notes(os.path.join(data_dir, "meeting_notes.md")))
    all_units.extend(parse_slack_export(os.path.join(data_dir, "slack_export.json")))

    processed = []
    for u in all_units:
        raw_text = u.get("text", "")
        masked_text, redactions, count = mask_sensitive_content(raw_text)
        access_level = int(u.get("access_level", 1))
        if count > 0:
            access_level = max(access_level, 3)

        u_copy = dict(u)
        u_copy["text"] = masked_text
        u_copy["redactions_json"] = redactions
        u_copy["access_level"] = access_level
        processed.append(u_copy)

    return processed


def parse_uploaded_source(filename: str, content: str, project_id: str = "campusconnect") -> List[Dict[str, Any]]:
    """
    Parses an uploaded text/JSON/CSV/MD file, applying the same masking rules.
    Max 2 MB allowed by caller.
    """
    ext = os.path.splitext(filename)[1].lower()
    units: List[Dict[str, Any]] = []

    if ext == ".json":
        data = json.loads(content)
        if isinstance(data, list):
            for idx, item in enumerate(data):
                uid = item.get("id") or f"ev-upload-{uuid.uuid4().hex[:8]}"
                raw_text = item.get("text", "")
                masked, redactions, cnt = mask_sensitive_content(raw_text)
                lvl = int(item.get("access_level", 1))
                if cnt > 0:
                    lvl = max(lvl, 3)
                units.append({
                    "id": uid,
                    "project_id": project_id,
                    "source_type": item.get("source_type", "upload"),
                    "source_ref": item.get("source_ref", f"{filename} #{idx+1}"),
                    "location": item.get("location", filename),
                    "author": item.get("author", "Uploader"),
                    "timestamp": item.get("timestamp") or datetime.now(timezone.utc).isoformat(),
                    "text": masked,
                    "access_level": lvl,
                    "redactions_json": redactions,
                })
    elif ext == ".csv":
        import io
        reader = csv.DictReader(io.StringIO(content))
        for idx, row in enumerate(reader):
            uid = row.get("id") or f"ev-upload-{uuid.uuid4().hex[:8]}"
            raw_text = row.get("text", "")
            masked, redactions, cnt = mask_sensitive_content(raw_text)
            lvl = int(row.get("access_level", 1))
            if cnt > 0:
                lvl = max(lvl, 3)
            units.append({
                "id": uid,
                "project_id": project_id,
                "source_type": row.get("source_type", "upload"),
                "source_ref": row.get("source_ref", f"{filename} row {idx+1}"),
                "location": row.get("location", filename),
                "author": row.get("author", "Uploader"),
                "timestamp": row.get("timestamp") or datetime.now(timezone.utc).isoformat(),
                "text": masked,
                "access_level": lvl,
                "redactions_json": redactions,
            })
    elif ext in (".md", ".txt"):
        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
        for idx, para in enumerate(paragraphs):
            uid = f"ev-upload-{uuid.uuid4().hex[:8]}"
            masked, redactions, cnt = mask_sensitive_content(para)
            lvl = 1
            if cnt > 0:
                lvl = max(lvl, 3)
            units.append({
                "id": uid,
                "project_id": project_id,
                "source_type": "document",
                "source_ref": f"{filename} para {idx+1}",
                "location": filename,
                "author": "Uploader",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "text": masked,
                "access_level": lvl,
                "redactions_json": redactions,
            })
    return units
