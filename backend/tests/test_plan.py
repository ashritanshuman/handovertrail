import pytest
from app.services.plan import generate_plan_items, score_candidate_claim


def test_deterministic_plan_generation():
    """Generates plan twice with same claims and asserts identical output."""
    sample_claims = [
        {"id": "c1", "type": "task", "owner": "Riya Sharma", "text": "Transfer Redis lock module", "status": "verified"},
        {"id": "c2", "type": "risk", "owner": "Riya Sharma", "text": "Stripe webhook idempotency unreviewed", "status": "inferred"},
        {"id": "c3", "type": "decision", "owner": "Maya Patel", "text": "Vault TTL rotation schedule", "status": "conflicting"},
        {"id": "c4", "type": "contact", "owner": "Campus Partner", "text": "University IT liaison", "status": "verified"},
        {"id": "c5", "type": "dependency", "owner": "Apple Dev", "text": "APNS certificate renewal", "status": "verified"},
        {"id": "c6", "type": "task", "owner": "Team", "text": "Update orientation README", "status": "verified"},
        {"id": "c7", "type": "open_question", "owner": "Team", "text": "SSE reconnect backoff limits", "status": "missing"},
    ]

    plan_a = generate_plan_items(sample_claims, role_title="Backend Engineer", focus_areas=["Stripe", "Redis"])
    plan_b = generate_plan_items(sample_claims, role_title="Backend Engineer", focus_areas=["Stripe", "Redis"])

    assert len(plan_a) == len(plan_b)
    for item_a, item_b in zip(plan_a, plan_b):
        assert item_a["id"] == item_b["id"]
        assert item_a["day"] == item_b["day"]
        assert item_a["title"] == item_b["title"]
        assert item_a["claim_ids"] == item_b["claim_ids"]
        assert item_a["category"] == item_b["category"]


def test_plan_grounding_invariant():
    """Validates that every single plan item cites at least one valid input claim ID."""
    sample_claims = [
        {"id": "clm-001", "type": "task", "owner": "riya", "text": "Refactor auth"},
        {"id": "clm-002", "type": "risk", "owner": "riya", "text": "Database locks"},
    ]
    valid_ids = {"clm-001", "clm-002"}

    items = generate_plan_items(sample_claims)
    assert len(items) > 0
    for it in items:
        assert "claim_ids" in it
        assert len(it["claim_ids"]) >= 1
        for cid in it["claim_ids"]:
            assert cid in valid_ids


def test_role_and_focus_area_scoring():
    """Asserts that claims matching focus areas receive priority score boosts."""
    claim_generic = {"id": "c1", "type": "task", "owner": "team", "text": "General cleanup"}
    claim_focused = {"id": "c2", "type": "task", "owner": "team", "text": "Optimize Stripe payment webhooks"}

    score_without_focus = score_candidate_claim(claim_focused, focus_areas=[])
    score_with_focus = score_candidate_claim(claim_focused, focus_areas=["Stripe", "Payments"])

    assert score_with_focus > score_without_focus
    assert score_with_focus == score_without_focus + 25


def test_plan_api_permissions_and_lifecycle(client):
    """
    Tests end-to-end plan endpoints:
    - Maya generates plan
    - Arjun / Riya cannot generate or publish (403)
    - Maya edits item (day, title)
    - Arjun cannot see plan until published
    - Maya approves handover and publishes plan
    - Arjun can see published plan and toggle progress
    """
    # 1. Reset demo data
    res_load = client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})
    assert res_load.status_code == 200

    # 2. Arjun attempting to generate -> 403 Forbidden
    res_arjun_gen = client.post(
        "/api/plan/generate",
        json={"project_id": "campusconnect", "role_title": "Backend"},
        headers={"X-User-Id": "arjun"},
    )
    assert res_arjun_gen.status_code == 403

    # Missing header -> 401
    res_no_user = client.post("/api/plan/generate", json={"project_id": "campusconnect"})
    assert res_no_user.status_code == 401

    # 3. Maya generates plan
    res_maya_gen = client.post(
        "/api/plan/generate",
        json={"project_id": "campusconnect", "role_title": "Backend Engineer", "focus_areas": ["Vault", "Stripe"]},
        headers={"X-User-Id": "maya"},
    )
    assert res_maya_gen.status_code == 200
    plan_data = res_maya_gen.json()
    assert plan_data["status"] == "draft"
    assert len(plan_data["items"]) > 0
    first_item_id = plan_data["items"][0]["id"]

    # 4. Maya edits item
    res_edit = client.patch(
        f"/api/plan/items/{first_item_id}",
        json={"title": "Custom Lead Title: Urgent Takeover", "day": 1, "is_pinned": True},
        headers={"X-User-Id": "maya"},
    )
    assert res_edit.status_code == 200
    updated_items = res_edit.json()["items"]
    edited = next(it for it in updated_items if it["id"] == first_item_id)
    assert edited["title"] == "Custom Lead Title: Urgent Takeover"
    assert edited["is_pinned"] is True

    # 5. Arjun attempts GET /api/plan before publish -> 404 Not Found
    res_arjun_get = client.get("/api/plan?project_id=campusconnect", headers={"X-User-Id": "arjun"})
    assert res_arjun_get.status_code == 404

    # 6. Maya attempts to publish without approved handover -> 409
    res_early_pub = client.post(
        "/api/plan/publish",
        json={"project_id": "campusconnect", "acknowledge_warnings": True},
        headers={"X-User-Id": "maya"},
    )
    assert res_early_pub.status_code == 409

    # 7. Maya resolves conflict and approves handover
    client.patch(
        "/api/claims/clm-004",
        json={"review_state": "confirmed", "text": "External API keys rotate quarterly (90 days)."},
        headers={"X-User-Id": "maya"},
    )
    res_approve = client.post(
        "/api/approve",
        json={"project_id": "campusconnect", "acknowledge_unresolved": True},
        headers={"X-User-Id": "maya"},
    )
    assert res_approve.status_code == 200

    # 8. Maya publishes plan
    res_pub = client.post(
        "/api/plan/publish",
        json={"project_id": "campusconnect", "acknowledge_warnings": True},
        headers={"X-User-Id": "maya"},
    )
    assert res_pub.status_code == 200
    assert res_pub.json()["status"] == "published"

    # 9. Arjun can now retrieve published plan
    res_arjun_pub = client.get("/api/plan?project_id=campusconnect", headers={"X-User-Id": "arjun"})
    assert res_arjun_pub.status_code == 200
    arjun_plan = res_arjun_pub.json()
    assert arjun_plan["status"] == "published"

    # 10. Arjun marks an item done
    test_item_id = arjun_plan["items"][0]["id"]
    res_tick = client.patch(
        f"/api/plan/items/{test_item_id}/progress",
        json={"done": True},
        headers={"X-User-Id": "arjun"},
    )
    assert res_tick.status_code == 200
    assert res_tick.json()["done"] is True

    # Confirm progress persisted on next fetch
    res_arjun_reget = client.get("/api/plan?project_id=campusconnect", headers={"X-User-Id": "arjun"})
    ticked_item = next(it for it in res_arjun_reget.json()["items"] if it["id"] == test_item_id)
    assert ticked_item["done"] is True
    assert res_arjun_reget.json()["completed_count"] >= 1
