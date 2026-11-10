def test_approval_blocker_and_resolution(client):
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    # 1. Approval blocked with 409 because clm-004 is conflicting and draft
    res_blocked = client.post(
        "/api/approve",
        json={"project_id": "campusconnect"},
        headers={"X-User-Id": "maya"},
    )
    assert res_blocked.status_code == 409
    assert "Cannot approve handover" in res_blocked.json()["detail"]["message"]

    # 2. Approval succeeds with acknowledge_unresolved=True override
    res_override = client.post(
        "/api/approve",
        json={"project_id": "campusconnect", "acknowledge_unresolved": True},
        headers={"X-User-Id": "maya"},
    )
    assert res_override.status_code == 200
    assert res_override.json()["status"] == "approved"

    # Reset demo to test resolution path
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    # 3. Lead resolves conflict by confirming clm-004 with reconciled text
    res_resolve = client.patch(
        "/api/claims/clm-004",
        json={"review_state": "confirmed", "text": "External API keys rotate quarterly (90 days)."},
        headers={"X-User-Id": "maya"},
    )
    assert res_resolve.status_code == 200
    assert res_resolve.json()["status"] == "verified"

    # 4. Approval succeeds cleanly without override flag
    res_clean = client.post(
        "/api/approve",
        json={"project_id": "campusconnect", "notes": "Handover verified and resolved."},
        headers={"X-User-Id": "maya"},
    )
    assert res_clean.status_code == 200
    assert res_clean.json()["status"] == "approved"

