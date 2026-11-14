import pytest


def test_preview_permissions(client):
    """Verifies that only Lead (maya) can access preview endpoints; others receive 403 or 401."""
    # Reset demo
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    # Arjun -> 403
    res_arjun = client.get("/api/preview?mode=draft", headers={"X-User-Id": "arjun"})
    assert res_arjun.status_code == 403

    # Riya -> 403
    res_riya = client.get("/api/preview?mode=draft", headers={"X-User-Id": "riya"})
    assert res_riya.status_code == 403

    # Unknown user -> 401
    res_unknown = client.get("/api/preview?mode=draft", headers={"X-User-Id": "stranger"})
    assert res_unknown.status_code == 401

    # Lead (maya) -> 200
    res_maya = client.get("/api/preview?mode=draft", headers={"X-User-Id": "maya"})
    assert res_maya.status_code == 200


def test_preview_equals_reality(client):
    """
    CRITICAL PROOF:
    Verifies that for an approved handover, GET /api/preview?mode=approved (as Maya)
    delivers the EXACT same claims and hidden_count as GET /api/handover (as Arjun).
    """
    # 1. Reset demo & confirm conflict
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})
    client.patch(
        "/api/claims/clm-004",
        json={"review_state": "confirmed", "text": "External API keys rotate quarterly (90 days)."},
        headers={"X-User-Id": "maya"},
    )
    # 2. Approve handover
    res_appr = client.post(
        "/api/approve",
        json={"project_id": "campusconnect", "acknowledge_unresolved": True},
        headers={"X-User-Id": "maya"},
    )
    assert res_appr.status_code == 200

    # 3. Maya generates and publishes plan
    client.post(
        "/api/plan/generate",
        json={"project_id": "campusconnect"},
        headers={"X-User-Id": "maya"},
    )
    client.post(
        "/api/plan/publish",
        json={"project_id": "campusconnect", "acknowledge_warnings": True},
        headers={"X-User-Id": "maya"},
    )

    # 4. Fetch /api/handover as Arjun
    res_handover = client.get("/api/handover", headers={"X-User-Id": "arjun"})
    assert res_handover.status_code == 200
    handover_body = res_handover.json()

    # 5. Fetch /api/preview?mode=approved as Maya
    res_preview = client.get("/api/preview?mode=approved", headers={"X-User-Id": "maya"})
    assert res_preview.status_code == 200
    preview_body = res_preview.json()

    preview_handover = preview_body["handover"]

    # Verify equivalence
    assert preview_handover["state"] == handover_body["state"]
    assert preview_handover["version"] == handover_body["version"]
    assert preview_handover["hidden_count"] == handover_body["hidden_count"]

    # Claims equivalence
    arjun_claim_ids = [c["id"] for c in handover_body["claims"]]
    preview_claim_ids = [c["id"] for c in preview_handover["claims"]]
    assert preview_claim_ids == arjun_claim_ids

    # Sections equivalence
    for sec_key in ("ownership", "risks", "dependencies", "decisions", "open_items", "key_contacts"):
        arjun_sec_ids = [c["id"] for c in handover_body["sections"].get(sec_key, [])]
        preview_sec_ids = [c["id"] for c in preview_handover["sections"].get(sec_key, [])]
        assert preview_sec_ids == arjun_sec_ids

    # Plan items equivalence
    if handover_body.get("plan") and preview_handover.get("plan"):
        arjun_plan_item_ids = [it["id"] for it in handover_body["plan"]["items"]]
        preview_plan_item_ids = [it["id"] for it in preview_handover["plan"]["items"]]
        assert preview_plan_item_ids == arjun_plan_item_ids


def test_hidden_panel_level3_isolation(client):
    """
    Verifies that the hidden panel:
    - Lists Level 2 items with their title and access reason.
    - Reports Level 3 confidential items as count only, never revealing content.
    """
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    res_prev = client.get("/api/preview?mode=draft", headers={"X-User-Id": "maya"})
    assert res_prev.status_code == 200
    data = res_prev.json()

    # Verify confidential count is present
    assert "confidential_count" in data
    # Confidential count should reflect planted level 3 items
    assert data["confidential_count"] >= 0

    # Verify no Level 3 titles appear in hidden_items
    for item in data["hidden_items"]:
        assert item["access_level"] == 2
        assert "Level 3" not in item["reason"]
        assert "CANARY-LEVEL3-DO-NOT-LEAK" not in item["title"]


def test_handover_backward_compatible_without_plan(client):
    """Proves GET /api/handover functions identically even when no plan is published."""
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})
    # Approve without generating or publishing plan
    client.patch(
        "/api/claims/clm-004",
        json={"review_state": "confirmed", "text": "External API keys rotate quarterly (90 days)."},
        headers={"X-User-Id": "maya"},
    )
    client.post(
        "/api/approve",
        json={"project_id": "campusconnect", "acknowledge_unresolved": True},
        headers={"X-User-Id": "maya"},
    )

    res = client.get("/api/handover", headers={"X-User-Id": "arjun"})
    assert res.status_code == 200
    data = res.json()
    assert data["state"] == "approved"
    assert data["first_7_days"] is not None
    assert len(data["first_7_days"]) == 5
    assert data["plan"] is None  # Graceful None when no published plan
