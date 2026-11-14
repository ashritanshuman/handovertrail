import pytest


def test_detect_all_four_planted_conflicts(client):
    """
    Verifies that the conflict detection engine identifies all 4 planted conflict groups:
    1. cg-api-key-rotation (monthly vs quarterly rotation period)
    2. cg-owner-payment-recon (Riya sole owner vs Maya assumed primary owner)
    3. cg-date-cert-cutover (Nov 30 renewal vs Nov 15 buffer cutover)
    4. cg-status-websocket-sse (WebSocket deployed vs SSE superseded)
    """
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    # Trigger detection
    res = client.post("/api/conflicts/detect", headers={"X-User-Id": "maya"})
    assert res.status_code == 200
    groups = res.json()
    assert len(groups) >= 4

    group_ids = [g["id"] for g in groups]
    assert "cg-api-key-rotation" in group_ids
    assert "cg-owner-payment-recon" in group_ids
    assert "cg-date-cert-cutover" in group_ids
    assert "cg-status-websocket-sse" in group_ids

    # Check supersession type and suggestion for websocket
    ws_group = next(g for g in groups if g["id"] == "cg-status-websocket-sse")
    assert ws_group["type"] == "supersession"
    assert ws_group["suggestion"] is not None
    assert "superseded" in ws_group["suggestion"].lower()


def test_list_and_get_conflicts_as_lead(client):
    """Lead Maya can view conflict groups with linked claims and leaver answers."""
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    res = client.get("/api/conflicts", headers={"X-User-Id": "maya"})
    assert res.status_code == 200
    groups = res.json()
    assert len(groups) >= 4

    # Each open group must have at least 2 linked claims
    for g in groups:
        assert len(g["claims"]) >= 2
        assert g["status"] == "open"
        assert g["confidence"] == "high"

    # Single conflict detail lookup
    res_single = client.get("/api/conflicts/cg-api-key-rotation", headers={"X-User-Id": "maya"})
    assert res_single.status_code == 200
    single = res_single.json()
    assert single["id"] == "cg-api-key-rotation"
    assert single["attribute"] == "period"
    assert len(single["claims"]) >= 2


def test_conflict_filtering_by_status_and_type(client):
    """Filters conflict groups by status (open/resolved) and type (contradiction/supersession)."""
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    # Filter by type=supersession
    res_super = client.get("/api/conflicts?type=supersession", headers={"X-User-Id": "maya"})
    assert res_super.status_code == 200
    super_groups = res_super.json()
    assert len(super_groups) == 1
    assert super_groups[0]["id"] == "cg-status-websocket-sse"

    # Filter by type=contradiction
    res_contra = client.get("/api/conflicts?type=contradiction", headers={"X-User-Id": "maya"})
    assert res_contra.status_code == 200
    contra_groups = res_contra.json()
    assert len(contra_groups) >= 3


def test_conflicts_access_control(client):
    """
    Conflict management is lead-only (Maya).
    Successor Arjun receives 403 Forbidden.
    Leaver Riya receives 403 Forbidden.
    Unknown or missing user receives 401 Unauthorized.
    """
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    # Arjun (Successor) -> 403
    res_arjun = client.get("/api/conflicts", headers={"X-User-Id": "arjun"})
    assert res_arjun.status_code == 403

    res_arjun_detect = client.post("/api/conflicts/detect", headers={"X-User-Id": "arjun"})
    assert res_arjun_detect.status_code == 403

    # Riya (Leaver) -> 403
    res_riya = client.get("/api/conflicts", headers={"X-User-Id": "riya"})
    assert res_riya.status_code == 403

    # Unknown user -> 401
    res_unknown = client.get("/api/conflicts", headers={"X-User-Id": "stranger"})
    assert res_unknown.status_code == 401

    res_no_header = client.get("/api/conflicts")
    assert res_no_header.status_code == 401

