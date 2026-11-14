def test_evidence_clearance_filtering(client):
    # Arjun (Clearance 1)
    res_arjun = client.get("/api/evidence", headers={"X-User-Id": "arjun"})
    assert res_arjun.status_code == 200
    units_arjun = res_arjun.json()
    for u in units_arjun:
        assert u["access_level"] <= 1
        assert "Notice period set to 6 weeks" not in u["text"]

    # Maya (Clearance 2)
    res_maya = client.get("/api/evidence", headers={"X-User-Id": "maya"})
    assert res_maya.status_code == 200
    units_maya = res_maya.json()
    assert len(units_maya) >= len(units_arjun)
    level_2_found = any(u["access_level"] == 2 for u in units_maya)
    assert level_2_found


def test_claim_clearance_filtering(client):
    # Arjun (Clearance 1)
    res_arjun = client.get("/api/claims", headers={"X-User-Id": "arjun"})
    assert res_arjun.status_code == 200
    claims_arjun = res_arjun.json()
    for c in claims_arjun:
        assert c["access_level"] <= 1

    # Maya (Clearance 2)
    res_maya = client.get("/api/claims", headers={"X-User-Id": "maya"})
    assert res_maya.status_code == 200
    claims_maya = res_maya.json()
    has_level_2 = any(c["access_level"] == 2 for c in claims_maya)
    assert has_level_2


def test_permissions_rules(client):
    # 1. Arjun cannot PATCH (403)
    res_patch = client.patch(
        "/api/claims/clm-001",
        json={"review_state": "confirmed"},
        headers={"X-User-Id": "arjun"},
    )
    assert res_patch.status_code == 403

    # 2. Arjun cannot approve (403)
    res_appr_arjun = client.post(
        "/api/approve",
        json={"project_id": "campusconnect"},
        headers={"X-User-Id": "arjun"},
    )
    assert res_appr_arjun.status_code == 403

    # 3. Riya cannot approve (403)
    res_appr_riya = client.post(
        "/api/approve",
        json={"project_id": "campusconnect"},
        headers={"X-User-Id": "riya"},
    )
    assert res_appr_riya.status_code == 403

    # 4. Arjun gets 404 (not 403) for a level-3 evidence id (does not reveal existence)
    res_ev_l3 = client.get("/api/evidence/ev-slack-003", headers={"X-User-Id": "arjun"})
    assert res_ev_l3.status_code == 404

    # 5. Unknown user -> 401
    res_unknown = client.get("/api/claims", headers={"X-User-Id": "unknown_hacker"})
    assert res_unknown.status_code == 401

    # 6. Missing header -> 401
    res_missing = client.get("/api/claims")
    assert res_missing.status_code == 401


def test_lead_can_edit_and_approve(client):
    # Maya editing a claim
    res_edit = client.patch(
        "/api/claims/clm-004",
        json={"review_state": "confirmed", "text": "Quarterly API key rotation agreed."},
        headers={"X-User-Id": "maya"},
    )
    assert res_edit.status_code == 200
    assert res_edit.json()["review_state"] == "confirmed"

    # Maya approving handover
    res_approve = client.post(
        "/api/approve",
        json={"project_id": "campusconnect", "notes": "Handover approved by lead Maya.", "acknowledge_unresolved": True},
        headers={"X-User-Id": "maya"},
    )
    assert res_approve.status_code == 200
    assert res_approve.json()["status"] == "approved"
