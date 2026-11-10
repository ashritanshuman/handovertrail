def test_demo_load_idempotency(client):
    # First load
    r1 = client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})
    assert r1.status_code == 200
    d1 = r1.json()

    # Second load with force_reset
    r2 = client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})
    assert r2.status_code == 200
    d2 = r2.json()

    assert d1["evidence_count"] == d2["evidence_count"]
    assert d1["claims_loaded"] == d2["claims_loaded"]
    assert d1["gaps_loaded"] == d2["gaps_loaded"]

    # Compare evidence and claims lists
    ev1 = client.get("/api/evidence", headers={"X-User-Id": "maya"}).json()
    ev2 = client.get("/api/evidence", headers={"X-User-Id": "maya"}).json()
    assert len(ev1) == len(ev2)
    assert [e["id"] for e in ev1] == [e["id"] for e in ev2]

    clm1 = client.get("/api/claims", headers={"X-User-Id": "maya"}).json()
    clm2 = client.get("/api/claims", headers={"X-User-Id": "maya"}).json()
    assert len(clm1) == len(clm2)
    assert [c["id"] for c in clm1] == [c["id"] for c in clm2]
