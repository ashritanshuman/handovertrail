def test_planted_conflict_detection(client):
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    # Fetch claims as lead Maya
    res = client.get("/api/claims", headers={"X-User-Id": "maya"})
    assert res.status_code == 200
    claims = res.json()

    conflicting = [c for c in claims if c["status"] == "conflicting"]
    assert len(conflicting) > 0, "Planted conflict was not detected!"

    # Verify conflict details exist
    conf_claim = next(c for c in conflicting if c.get("conflict_group_id") == "cg-api-key-rotation")
    assert conf_claim["conflict_details"] is not None
    assert "monthly" in conf_claim["conflict_details"]["statement_a"].lower()
    assert "quarterly" in conf_claim["conflict_details"]["statement_b"].lower()

