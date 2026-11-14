import pytest
from app.services.share_check import run_share_check


def test_share_check_blocks_raw_secrets():
    """Validates that raw API keys and unmasked phone numbers trigger Block severity."""
    mock_key = "sk_test_dummy_token_for_testing_purposes_123456789"
    claims = [
        {
            "id": "c1",
            "text": f"Stripe test key {mock_key} is active",
            "access_level": 1,
            "evidence_ids": ["ev1"],
        },
        {
            "id": "c2",
            "text": "Emergency call to +91-98765-43210 for server restart",
            "access_level": 1,
            "evidence_ids": ["ev2"],
        },
    ]
    ev_map = {
        "ev1": {"id": "ev1", "access_level": 1},
        "ev2": {"id": "ev2", "access_level": 1},
    }

    can_publish, findings = run_share_check(claims, [], ev_map, successor_clearance=1)

    assert can_publish is False
    blockers = [f for f in findings if f["severity"] == "block"]
    assert len(blockers) >= 2

    # Verify no raw secret is echoed in messages
    for b in blockers:
        assert mock_key not in b["message"]
        assert "+91-98765-43210" not in b["message"]


def test_share_check_blocks_canary():
    """Validates that presence of canary string triggers Block finding."""
    claims = [
        {
            "id": "c1",
            "text": "This is a clean task",
            "quote": "Quote with CANARY-LEVEL3-DO-NOT-LEAK embedded",
            "access_level": 1,
            "evidence_ids": ["ev1"],
        }
    ]
    ev_map = {"ev1": {"id": "ev1", "access_level": 1}}

    can_publish, findings = run_share_check(claims, [], ev_map)
    assert can_publish is False
    assert any(f["category"] == "Canary Leak Detected" for f in findings)


def test_share_check_blocks_access_level_inconsistency():
    """Validates that a Team (Level 1) claim citing Level 2 evidence triggers Block finding."""
    claims = [
        {
            "id": "c1",
            "text": "Public architecture decision",
            "access_level": 1,
            "evidence_ids": ["ev-lead-only"],
        }
    ]
    ev_map = {
        "ev-lead-only": {"id": "ev-lead-only", "access_level": 2},
    }

    can_publish, findings = run_share_check(claims, [], ev_map, successor_clearance=1)
    assert can_publish is False
    assert any(f["category"] == "Access Level Inconsistency" for f in findings)


def test_share_check_warns_on_unresolved_conflicts():
    """Validates that unresolved conflicts and redactions produce warnings without blocking."""
    claims = [
        {
            "id": "c1",
            "text": "Token [REDACTED:api_key] removed",
            "status": "conflicting",
            "access_level": 1,
            "evidence_ids": ["ev1"],
        }
    ]
    ev_map = {"ev1": {"id": "ev1", "access_level": 1}}

    can_publish, findings = run_share_check(claims, [], ev_map, successor_clearance=1)
    assert can_publish is True  # Warnings do not prevent can_publish
    warns = [f for f in findings if f["severity"] == "warn"]
    assert len(warns) >= 2


def test_share_check_api_endpoint(client):
    """Verifies GET /api/preview/check returns structured share-check response for lead."""
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    # Arjun -> 403
    res_arjun = client.get("/api/preview/check", headers={"X-User-Id": "arjun"})
    assert res_arjun.status_code == 403

    # Maya -> 200
    res_maya = client.get("/api/preview/check", headers={"X-User-Id": "maya"})
    assert res_maya.status_code == 200
    data = res_maya.json()
    assert "can_publish" in data
    assert "findings" in data
    assert isinstance(data["findings"], list)
