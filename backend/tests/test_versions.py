from datetime import datetime, timezone


def test_list_versions_permissions(client):
    # Load demo data and approve initial version
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})
    client.patch(
        "/api/claims/clm-004",
        json={"review_state": "confirmed", "text": "External API keys rotate quarterly (90 days).", "note": "Resolved"},
        headers={"X-User-Id": "maya"},
    )
    res_appr = client.post(
        "/api/approve",
        json={"project_id": "campusconnect", "notes": "Initial release approved", "acknowledge_unresolved": True},
        headers={"X-User-Id": "maya"},
    )
    assert res_appr.status_code == 200

    # 1. Maya (Lead) gets full version summary
    res_maya = client.get("/api/versions", headers={"X-User-Id": "maya"})
    assert res_maya.status_code == 200
    versions_maya = res_maya.json()
    assert len(versions_maya) >= 1
    v0 = versions_maya[0]
    assert v0["version"] == "1.0.0"
    assert v0["approved_by"] == "maya"
    assert v0["claims_count"] > 0
    assert "status_counts" in v0
    assert "is_current" in v0
    assert v0["is_current"] is True

    # 2. Riya (Leaver) gets metadata only (claims_count is 0, empty status_counts)
    res_riya = client.get("/api/versions", headers={"X-User-Id": "riya"})
    assert res_riya.status_code == 200
    versions_riya = res_riya.json()
    assert len(versions_riya) >= 1
    vr0 = versions_riya[0]
    assert vr0["version"] == "1.0.0"
    assert vr0["approved_by"] == "maya"
    assert vr0["claims_count"] == 0
    assert vr0["status_counts"] == {}

    # 3. Arjun (Successor) gets 403 Forbidden
    res_arjun = client.get("/api/versions", headers={"X-User-Id": "arjun"})
    assert res_arjun.status_code == 403

    # 4. Unknown user gets 401 Unauthorized
    res_unknown = client.get("/api/versions", headers={"X-User-Id": "unknown_actor"})
    assert res_unknown.status_code == 401


def test_version_diff_added_removed_changed(client):
    # Reset demo and create V1.0.0
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})
    client.patch(
        "/api/claims/clm-004",
        json={"review_state": "confirmed", "text": "External API keys rotate monthly (30 days).", "note": "Initial setting"},
        headers={"X-User-Id": "maya"},
    )
    client.post(
        "/api/approve",
        json={"project_id": "campusconnect", "notes": "Version 1.0.0 ratified", "acknowledge_unresolved": True},
        headers={"X-User-Id": "maya"},
    )

    # Modify claim clm-004 (change owner and text with note) and reject clm-005
    client.patch(
        "/api/claims/clm-004",
        json={
            "text": "External API keys rotate quarterly (90 days) per PCI update.",
            "owner": "Arjun Rao",
            "review_state": "edited",
            "note": "Updated per Q4 security compliance review",
        },
        headers={"X-User-Id": "maya"},
    )
    client.patch(
        "/api/claims/clm-005",
        json={"review_state": "rejected", "note": "Deprecated subsystem"},
        headers={"X-User-Id": "maya"},
    )

    # Approve Version 1.1.0
    res_appr2 = client.post(
        "/api/approve",
        json={"project_id": "campusconnect", "notes": "Version 1.1.0 with quarterly rotation", "acknowledge_unresolved": True},
        headers={"X-User-Id": "maya"},
    )
    assert res_appr2.status_code == 200

    # Diff V1.0.0 -> V1.1.0 as Lead
    res_diff = client.get("/api/versions/diff?from=1.0.0&to=1.1.0", headers={"X-User-Id": "maya"})
    assert res_diff.status_code == 200
    diff = res_diff.json()

    assert diff["from_version"] == "1.0.0"
    assert diff["to_version"] == "1.1.0"

    # Changed claim clm-004
    changed_ids = [c["id"] for c in diff["changed"]]
    assert "clm-004" in changed_ids
    c4 = next(c for c in diff["changed"] if c["id"] == "clm-004")
    assert "quarterly" in c4["text"]
    assert "monthly" in c4["old_text"]
    assert c4["owner"] == "Arjun Rao"
    assert c4["old_owner"] == "Riya Sharma"
    assert c4["changed_by"] == "maya"
    assert "Q4 security compliance" in c4["note"]

    # Removed claim clm-005 (because rejected claims are excluded from snapshots)
    removed_ids = [c["id"] for c in diff["removed"]]
    assert "clm-005" in removed_ids

    # Unchanged claims count
    assert diff["unchanged_count"] > 0

    # Permissions check on diff: Leaver and Successor are forbidden
    res_diff_riya = client.get("/api/versions/diff?from=1.0.0&to=1.1.0", headers={"X-User-Id": "riya"})
    assert res_diff_riya.status_code == 403
    res_diff_arjun = client.get("/api/versions/diff?from=1.0.0&to=1.1.0", headers={"X-User-Id": "arjun"})
    assert res_diff_arjun.status_code == 403


def test_acknowledgement_tracking_status(client):
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})
    client.patch(
        "/api/claims/clm-004",
        json={"review_state": "confirmed", "text": "External API keys rotate quarterly (90 days)."},
        headers={"X-User-Id": "maya"},
    )
    client.post(
        "/api/approve",
        json={"project_id": "campusconnect", "notes": "Release v1.0", "acknowledge_unresolved": True},
        headers={"X-User-Id": "maya"},
    )

    # 1. Before acknowledgement: Arjun is Pending
    res_ack_track = client.get("/api/acknowledgements?version=1.0.0", headers={"X-User-Id": "maya"})
    assert res_ack_track.status_code == 200
    track_data = res_ack_track.json()
    assert track_data["acknowledged_count"] == 0
    assert track_data["pending_count"] == 1
    arjun_status = next(r for r in track_data["recipients"] if r["user_id"] == "arjun")
    assert arjun_status["status"] == "pending"

    # 2. Arjun acknowledges V1.0.0
    res_ack = client.post(
        "/api/acknowledge",
        json={"handover_version_id": "hv-v1.0.0", "note": "Received and understood by Arjun."},
        headers={"X-User-Id": "arjun"},
    )
    assert res_ack.status_code == 200

    # Status is now Acknowledged
    res_ack_track2 = client.get("/api/acknowledgements?version=1.0.0", headers={"X-User-Id": "maya"})
    assert res_ack_track2.json()["acknowledged_count"] == 1
    arjun_status2 = next(r for r in res_ack_track2.json()["recipients"] if r["user_id"] == "arjun")
    assert arjun_status2["status"] == "acknowledged"

    # 3. Maya approves a new version (V1.1.0)
    client.patch(
        "/api/claims/clm-001",
        json={"review_state": "confirmed", "text": "Updated architectural decision"},
        headers={"X-User-Id": "maya"},
    )
    client.post(
        "/api/approve",
        json={"project_id": "campusconnect", "notes": "Release v1.1", "acknowledge_unresolved": True},
        headers={"X-User-Id": "maya"},
    )

    # Now Arjun is Outdated for V1.1.0!
    res_ack_track3 = client.get("/api/acknowledgements?version=1.1.0", headers={"X-User-Id": "maya"})
    assert res_ack_track3.status_code == 200
    track_data3 = res_ack_track3.json()
    assert track_data3["acknowledged_count"] == 0
    assert track_data3["outdated_count"] == 1
    arjun_status3 = next(r for r in track_data3["recipients"] if r["user_id"] == "arjun")
    assert arjun_status3["status"] == "outdated"
    assert arjun_status3["previously_acknowledged_version"] == "1.0.0"

    # Arjun checks GET /api/handover and sees is_outdated is True
    res_handover = client.get("/api/handover", headers={"X-User-Id": "arjun"})
    assert res_handover.status_code == 200
    ho_body = res_handover.json()
    assert ho_body["acknowledged"] is False
    assert ho_body["is_outdated"] is True

    # 4. Attempting to acknowledge old V1.0.0 is refused with 400 Bad Request
    res_bad_ack = client.post(
        "/api/acknowledge",
        json={"handover_version_id": "hv-v1.0.0", "note": "Trying old version"},
        headers={"X-User-Id": "arjun"},
    )
    assert res_bad_ack.status_code == 400
    assert "superseded" in res_bad_ack.json()["detail"].lower()

    # 5. Acknowledging current V1.1.0 succeeds
    res_good_ack = client.post(
        "/api/acknowledge",
        json={"handover_version_id": "hv-v1.1.0", "note": "Acknowledged v1.1.0"},
        headers={"X-User-Id": "arjun"},
    )
    assert res_good_ack.status_code == 200

    # Arjun is now Acknowledged again
    res_ack_track4 = client.get("/api/acknowledgements", headers={"X-User-Id": "maya"})
    assert res_ack_track4.json()["acknowledged_count"] == 1
    assert res_ack_track4.json()["outdated_count"] == 0


def test_seed_history_demo_helper(client):
    # Load demo data first
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    # Seed demo history
    res_seed = client.post("/api/demo/seed-history", headers={"X-User-Id": "maya"})
    assert res_seed.status_code == 200
    seed_data = res_seed.json()
    assert seed_data["status"] == "success"
    assert "1.0.0" in seed_data["versions"]
    assert "1.1.0" in seed_data["versions"]

    # Verify versions endpoint
    res_v = client.get("/api/versions", headers={"X-User-Id": "maya"})
    assert len(res_v.json()) == 2

    # Verify diff
    res_diff = client.get("/api/versions/diff?from=1.0.0&to=1.1.0", headers={"X-User-Id": "maya"})
    assert res_diff.status_code == 200
    diff = res_diff.json()
    assert any(c["id"] == "clm-004" for c in diff["changed"])

    # Verify acknowledgement shows Arjun as outdated
    res_ack = client.get("/api/acknowledgements?version=1.1.0", headers={"X-User-Id": "maya"})
    assert res_ack.json()["outdated_count"] == 1


def test_canary_leak_protection_versions(client):
    # Run seed history to have two versions and audit logs
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})
    client.post("/api/demo/seed-history", headers={"X-User-Id": "maya"})

    canary_l3 = "CANARY-LEVEL3-DO-NOT-LEAK"
    canary_l2 = "CANARY-LEVEL2-HR"

    # Endpoints tested as Maya
    for ep in ["/api/versions", "/api/versions/1.0.0", "/api/versions/1.1.0", "/api/versions/diff?from=1.0.0&to=1.1.0", "/api/acknowledgements"]:
        res_m = client.get(ep, headers={"X-User-Id": "maya"})
        assert canary_l3 not in res_m.text, f"Level-3 canary leaked in {ep} to Maya!"

    # Endpoints tested as Riya
    res_r = client.get("/api/versions", headers={"X-User-Id": "riya"})
    assert canary_l3 not in res_r.text, "Level-3 canary leaked in /api/versions to Riya!"

    # Endpoints tested as Arjun (Clearance 1)
    for ep in ["/api/versions", "/api/versions/1.0.0", "/api/versions/diff"]:
        res_a = client.get(ep, headers={"X-User-Id": "arjun"})
        assert res_a.status_code in (403, 404)
        assert canary_l3 not in res_a.text, f"Level-3 canary leaked in {ep} error to Arjun!"
        assert canary_l2 not in res_a.text, f"Level-2 canary leaked in {ep} error to Arjun!"
