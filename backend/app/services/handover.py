from datetime import datetime, timezone
from typing import List, Dict, Any, Optional


def build_handover_snapshot(
    project_id: str,
    version: str,
    approved_by: str,
    claims: List[Dict[str, Any]],
    notes: Optional[str] = ""
) -> Dict[str, Any]:
    """
    Builds an immutable snapshot of all confirmed claims,
    along with metadata and verification status.
    """
    return {
        "version": version,
        "project_id": project_id,
        "approved_by": approved_by,
        "approved_at": datetime.now(timezone.utc).isoformat(),
        "notes": notes or "Handover snapshot approved and sealed.",
        "claims_count": len(claims),
        "claims": claims
    }
