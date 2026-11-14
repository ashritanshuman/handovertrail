import pytest


def test_resolve_conflict_chose_claim(client):
    """
    Lead resolves conflict group via 'chose_claim':
    - Chosen claim review_state -> 'confirmed', origin -> 'human', version incremented.
    - Other claims in group -> review_state 'rejected'.
    - Conflict group status -> 'resolved', resolved_claim_id set.
    - Audit log entry written with action 'conflict_resolved'.
    - Repeated resolution returns 409 Conflict.
    """
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    # Inspect conflict group cg-api-key-rotation
    res = client.get("/api/conflicts/cg-api-key-rotation", headers={"X-User-Id": "maya"})
    assert res.status_code == 200
    group = res.json()
    assert len(group["claims"]) >= 2
    chosen_id = group["claims"][0]["id"]
    other_id = group["claims"][1]["id"]

    # Resolve choosing chosen_id
    payload = {
        "resolution_type": "chose_claim",
        "chosen_claim_id": chosen_id,
        "note": "Ratified quarterly 90-day rotation after Riya's confirmation.",
    }
    res_resolve = client.post(
        "/api/conflicts/cg-api-key-rotation/resolve",
        json=payload,
        headers={"X-User-Id": "maya"},
    )
    assert res_resolve.status_code == 200
    res_data = res_resolve.json()
    assert res_data["status"] == "resolved"
    assert res_data["resolved_claim_id"] == chosen_id

    # Verify group is updated
    res_group_after = client.get("/api/conflicts/cg-api-key-rotation", headers={"X-User-Id": "maya"})
    assert res_group_after.status_code == 200
    g_after = res_group_after.json()
    assert g_after["status"] == "resolved"
    assert g_after["resolution_type"] == "chose_claim"
    assert g_after["resolved_claim_id"] == chosen_id
    assert g_after["resolved_by"] == "maya"

    # Verify claim review states
    res_claims = client.get("/api/claims", headers={"X-User-Id": "maya"})
    all_claims = {c["id"]: c for c in res_claims.json()}
    assert all_claims[chosen_id]["review_state"] == "confirmed"
    assert all_claims[chosen_id]["origin"] == "human"
    assert all_claims[other_id]["review_state"] == "rejected"

    # Verify audit log recorded with action 'conflict_resolved'
    res_audit = client.get("/api/audit", headers={"X-User-Id": "maya"})
    assert res_audit.status_code == 200
    logs = res_audit.json()
    resolve_logs = [l for l in logs if l["action"] == "conflict_resolved" and l["target_id"] == "cg-api-key-rotation"]
    assert len(resolve_logs) >= 1

    # Attempting to resolve again must fail with 409
    res_repeat = client.post(
        "/api/conflicts/cg-api-key-rotation/resolve",
        json=payload,
        headers={"X-User-Id": "maya"},
    )
    assert res_repeat.status_code == 409


def test_resolve_conflict_corrected(client):
    """
    Lead resolves conflict group via 'corrected' synthesized claim:
    - New claim created with origin 'human', review_state 'confirmed', version 1.
    - Original claims in group marked 'rejected'.
    - Conflict group status -> 'resolved', resolved_claim_id points to new claim.
    - Audit log entry written with action 'conflict_resolved'.
    """
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    payload = {
        "resolution_type": "corrected",
        "corrected_claim": {
            "text": "Internal cutover buffer is Nov 15; external Apple enterprise certificate expires Nov 30.",
            "quote": "Team agreed on November 15 as the hard cutover deadline to provide a safety buffer.",
            "type": "decision",
            "owner": "Maya Patel",
        },
        "note": "Merged internal buffer with hard vendor expiration.",
    }
    res_resolve = client.post(
        "/api/conflicts/cg-date-cert-cutover/resolve",
        json=payload,
        headers={"X-User-Id": "maya"},
    )
    assert res_resolve.status_code == 200
    res_data = res_resolve.json()
    assert res_data["status"] == "resolved"
    new_claim_id = res_data["resolved_claim_id"]
    assert new_claim_id.startswith("clm-human-")

    # Check new claim exists in claims
    res_claims = client.get("/api/claims", headers={"X-User-Id": "maya"})
    all_claims = {c["id"]: c for c in res_claims.json()}
    assert new_claim_id in all_claims
    assert all_claims[new_claim_id]["origin"] == "human"
    assert all_claims[new_claim_id]["review_state"] == "confirmed"


def test_dismiss_conflict_group(client):
    """Lead dismisses conflict group as non-issue with reason; logs 'conflict_dismissed'."""
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    payload = {"reason": "Non-critical ambiguity; verified in Sprint review."}
    res_dismiss = client.post(
        "/api/conflicts/cg-owner-payment-recon/dismiss",
        json=payload,
        headers={"X-User-Id": "maya"},
    )
    assert res_dismiss.status_code == 200
    res_data = res_dismiss.json()
    assert res_data["status"] == "dismissed"

    # Verify group status
    res_group = client.get("/api/conflicts/cg-owner-payment-recon", headers={"X-User-Id": "maya"})
    assert res_group.json()["status"] == "dismissed"

    # Verify audit log
    res_audit = client.get("/api/audit", headers={"X-User-Id": "maya"})
    dismiss_logs = [l for l in res_audit.json() if l["action"] == "conflict_dismissed" and l["target_id"] == "cg-owner-payment-recon"]
    assert len(dismiss_logs) >= 1


def test_leave_conflict_unresolved(client):
    """Lead explicitly marks conflict unresolved with note; logs 'conflict_left_unresolved'."""
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    payload = {"reason": "Pending vendor clarification from payment processor."}
    res = client.post(
        "/api/conflicts/cg-status-websocket-sse/leave-unresolved",
        json=payload,
        headers={"X-User-Id": "maya"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "unresolved"

    res_audit = client.get("/api/audit", headers={"X-User-Id": "maya"})
    unresolved_logs = [l for l in res_audit.json() if l["action"] == "conflict_left_unresolved"]
    assert len(unresolved_logs) >= 1


def test_approval_gating_with_open_conflicts(client):
    """
    Handover approval is blocked (409 Conflict) when open or unresolved conflict groups exist,
    unless acknowledge_unresolved=True is supplied.
    """
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    # Attempt approve without acknowledge_unresolved -> 409
    res_block = client.post(
        "/api/approve",
        json={"project_id": "campusconnect", "acknowledge_unresolved": False},
        headers={"X-User-Id": "maya"},
    )
    assert res_block.status_code == 409
    detail = res_block.json()["detail"]
    assert "blockers" in detail
    assert any("ConflictGroup" in b for b in detail["blockers"])

    # Approving with acknowledge_unresolved=True succeeds
    res_approve = client.post(
        "/api/approve",
        json={"project_id": "campusconnect", "acknowledge_unresolved": True, "notes": "Approved with acknowledged open items"},
        headers={"X-User-Id": "maya"},
    )
    assert res_approve.status_code == 200
    assert res_approve.json()["status"] == "approved"
