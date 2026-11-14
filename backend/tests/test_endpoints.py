def test_full_handover_workflow(client):
    # 1. Reset & Seed Demo
    res_load = client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})
    assert res_load.status_code == 200
    assert res_load.json()["status"] == "success"

    # 2. Project details
    res_proj = client.get("/api/project", headers={"X-User-Id": "arjun"})
    assert res_proj.status_code == 200
    assert res_proj.json()["id"] == "campusconnect"

    # 3. Masking verification on ingested evidence
    res_ev = client.get("/api/evidence", headers={"X-User-Id": "maya"})
    assert res_ev.status_code == 200
    all_ev = res_ev.json()
    incident_ev = next((e for e in all_ev if "SMS gateway" in e["text"]), None)
    if incident_ev:
        assert "[REDACTED_API_KEY]" in incident_ev["text"]
        assert "[REDACTED_PHONE]" in incident_ev["text"]
        assert "sk_live_campusevents" not in incident_ev["text"]

    # 4. Check Planted Conflict
    res_claims = client.get("/api/claims", headers={"X-User-Id": "maya"})
    assert res_claims.status_code == 200
    claims = res_claims.json()
    conflict_claim = next((c for c in claims if c["status"] == "conflicting"), None)
    assert conflict_claim is not None
    assert conflict_claim["conflict_details"] is not None

    # 5. Lead resolves conflict via conflict resolution endpoint
    res_resolve = client.post(
        "/api/conflicts/cg-api-key-rotation/resolve",
        json={"resolution_type": "chose_claim", "chosen_claim_id": "clm-004", "note": "Ratified quarterly rotation policy."},
        headers={"X-User-Id": "maya"},
    )
    assert res_resolve.status_code == 200
    assert res_resolve.json()["status"] == "resolved"

    # 6. Gaps flow
    res_gaps = client.get("/api/gaps", headers={"X-User-Id": "riya"})
    assert res_gaps.status_code == 200
    gaps = res_gaps.json()
    assert len(gaps) > 0
    first_gap = gaps[0]

    res_ans = client.post(
        f"/api/gaps/{first_gap['id']}/answer",
        json={"answer": "PR #88 leaks sockets under abrupt close. We replaced it with SSE polling in PR #94."},
        headers={"X-User-Id": "riya"},
    )
    assert res_ans.status_code == 200
    assert res_ans.json()["state"] == "answered"

    # 7. Timeline & Stats
    res_timeline = client.get("/api/timeline", headers={"X-User-Id": "arjun"})
    assert res_timeline.status_code == 200
    assert len(res_timeline.json()) > 0

    res_stats = client.get("/api/stats", headers={"X-User-Id": "maya"})
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert stats["readiness_percentage"] > 0

    # 8. Lead approves handover (with acknowledge_unresolved=True for open planted items)
    res_approve = client.post(
        "/api/approve",
        json={"project_id": "campusconnect", "notes": "Final handover approved by Maya Patel.", "acknowledge_unresolved": True},
        headers={"X-User-Id": "maya"},
    )
    assert res_approve.status_code == 200
    assert res_approve.json()["status"] == "approved"

    # 9. Successor views approved handover
    res_handover = client.get("/api/handover", headers={"X-User-Id": "arjun"})
    assert res_handover.status_code == 200
    handover_data = res_handover.json()
    assert handover_data["version"] == "1.0.0"
    assert handover_data["viewer_clearance"] == 1
    # Ensure all claims in Arjun's handover are Level 1
    for c in handover_data["claims"]:
        assert c["access_level"] <= 1

    # 10. Successor acknowledges
    res_ack = client.post(
        "/api/acknowledge",
        json={"handover_version_id": "hv-v1.0", "note": "Acknowledged and understood by Arjun."},
        headers={"X-User-Id": "arjun"},
    )
    assert res_ack.status_code == 200
    assert res_ack.json()["status"] == "success"

    # 11. Audit trail
    res_audit = client.get("/api/audit", headers={"X-User-Id": "maya"})
    assert res_audit.status_code == 200
    actions = [a["action"] for a in res_audit.json()]
    assert "APPROVE_HANDOVER" in actions
    assert "ACKNOWLEDGE" in actions

    # 12. Ask Q&A with citations
    res_ask = client.post(
        "/api/ask",
        json={"project_id": "campusconnect", "question": "What is the policy for rotating payment API keys?"},
        headers={"X-User-Id": "arjun"},
    )
    assert res_ask.status_code == 200
    ask_data = res_ask.json()
    assert len(ask_data["citations"]) > 0
    assert "quarterly" in ask_data["answer"].lower()

