import os
import json
import csv
from datetime import datetime, timezone
from typing import List, Dict, Any


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
                "project_id": row["project_id"],
                "source_type": "jira",
                "source_ref": row["source_ref"],
                "location": row.get("location", ""),
                "author": row["author"],
                "timestamp": row["timestamp"],
                "text": row["text"],
                "access_level": int(row.get("access_level", 1))
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
            "access_level": access_level
        })
    return units


def parse_slack_export(file_path: str) -> List[Dict[str, Any]]:
    if not os.path.exists(file_path):
        return []
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def ingest_demo_data(data_dir: str) -> List[Dict[str, Any]]:
    """Loads all evidence units from data/demo directory."""
    all_units = []
    all_units.extend(parse_github_export(os.path.join(data_dir, "github_export.json")))
    all_units.extend(parse_tasks_csv(os.path.join(data_dir, "tasks.csv")))
    all_units.extend(parse_meeting_notes(os.path.join(data_dir, "meeting_notes.md")))
    all_units.extend(parse_slack_export(os.path.join(data_dir, "slack_export.json")))
    return all_units

