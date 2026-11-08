def test_evidence_clearance_filtering(client):
    # Arjun (Clearance 1)
    res_arjun = client.get("/api/evidence", headers={"X-User-Id": "arjun"})
    assert res_arjun.status_code == 200
    units_arjun = res_arjun.json()
    # Arjun must NOT see any units with access_level > 1
    for u in units_arjun:
        assert u["access_level"] <= 1
        assert "Notice period set to 6 weeks" not in u["text"]

    # Maya (Clearance 2)
    res_maya = client.get("/api/evidence", headers={"X-User-Id": "maya"})
    assert res_maya.status_code == 200
    units_maya = res_maya.json()
    # Maya should see more units, including Level 2 units
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
    # Claim 014 is access level 2 (HR transition plan)
    has_level_2 = any(c["access_level"] == 2 for c in claims_maya)
    assert has_level_2


def test_successor_cannot_approve_or_edit(client):
    # Arjun attempting to edit a claim
    res_edit = client.patch(
        "/api/claims/clm-001",
        json={"review_state": "confirmed"},
        headers={"X-User-Id": "arjun"},
    )
    assert res_edit.status_code == 403

    # Arjun attempting to approve a handover
    res_approve = client.post(
        "/api/approve",
        json={"project_id": "campusconnect", "notes": "Hacked approve"},
        headers={"X-User-Id": "arjun"},
    )
    assert res_approve.status_code == 403


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
        json={"project_id": "campusconnect", "notes": "Handover approved by lead Maya."},
        headers={"X-User-Id": "maya"},
    )
    assert res_approve.status_code == 200
    assert res_approve.json()["status"] == "approved"
