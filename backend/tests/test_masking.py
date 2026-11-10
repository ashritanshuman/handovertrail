from app.models import EvidenceUnit


def test_planted_secrets_absent_from_db_and_api(client, db_session):
    # Load demo data
    res_load = client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})
    assert res_load.status_code == 200

    planted_secret = "sk_live_campusevents"
    planted_phone = "+91-98765-43210"

    # 1. Assert secrets never exist in any database row
    all_units = db_session.query(EvidenceUnit).all()
    assert len(all_units) > 0
    for u in all_units:
        assert planted_secret not in u.text, f"Secret leaked in DB row {u.id}"
        assert planted_phone not in u.text, f"Phone leaked in DB row {u.id}"

    # 2. Assert secrets never appear in any API response (even for lead Maya with clearance 2)
    endpoints = [
        "/api/evidence",
        "/api/claims",
        "/api/timeline",
        "/api/gaps",
    ]
    for ep in endpoints:
        resp = client.get(ep, headers={"X-User-Id": "maya"})
        assert resp.status_code == 200
        text = resp.text
        assert planted_secret not in text, f"Secret leaked in endpoint {ep}"
        assert planted_phone not in text, f"Phone leaked in endpoint {ep}"
