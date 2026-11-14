def test_canary_leak_protection(client):
    # Ensure demo is loaded and handover is approved
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})
    client.patch(
        "/api/claims/clm-004",
        json={"review_state": "confirmed", "text": "External API keys rotate quarterly (90 days)."},
        headers={"X-User-Id": "maya"},
    )
    client.post(
        "/api/approve",
        json={"project_id": "campusconnect", "notes": "Approved for successor", "acknowledge_unresolved": True},
        headers={"X-User-Id": "maya"},
    )

    canary_l3 = "CANARY-LEVEL3-DO-NOT-LEAK"
    canary_l2 = "CANARY-LEVEL2-HR"
    hr_sensitive_phrases = ["transition bonus", "Notice period set to 6 weeks", "Confidential HR"]

    # Endpoints requested as Arjun (Clearance Level 1)
    get_endpoints = [
        "/api/evidence",
        "/api/claims",
        "/api/handover",
        "/api/timeline",
        "/api/gaps",
        "/api/conflicts",
        "/api/conflicts/cg-api-key-rotation",
        "/api/interview",
    ]

    for ep in get_endpoints:
        res = client.get(ep, headers={"X-User-Id": "arjun"})
        body = res.text
        assert canary_l3 not in body, f"Canary Level 3 leaked in {ep} to Arjun!"
        assert canary_l2 not in body, f"Canary Level 2 leaked in {ep} to Arjun!"
        for phrase in hr_sensitive_phrases:
            assert phrase not in body, f"HR confidential phrase '{phrase}' leaked in {ep} to Arjun!"

    # Level-3 canary must appear nowhere, even for Lead Maya or Leaver Riya
    for persona in ["maya", "riya"]:
        for ep in ["/api/conflicts", "/api/interview", "/api/claims", "/api/gaps"]:
            res_p = client.get(ep, headers={"X-User-Id": persona})
            assert canary_l3 not in res_p.text, f"Canary Level 3 leaked in {ep} to {persona}!"

    # POST /api/ask as Arjun
    res_ask = client.post(
        "/api/ask",
        json={"project_id": "campusconnect", "question": "What are the secret tokens and transition bonuses?"},
        headers={"X-User-Id": "arjun"},
    )
    body_ask = res_ask.text
    assert canary_l3 not in body_ask, "Canary Level 3 leaked in /api/ask to Arjun!"
    assert canary_l2 not in body_ask, "Canary Level 2 leaked in /api/ask to Arjun!"
    for phrase in hr_sensitive_phrases:
        assert phrase not in body_ask, f"HR confidential phrase '{phrase}' leaked in /api/ask to Arjun!"

    # Probing privileged evidence unit ID as Arjun returns 404 with no canary leak
    res_probe = client.get("/api/evidence/ev-slack-003", headers={"X-User-Id": "arjun"})
    assert res_probe.status_code == 404
    assert canary_l3 not in res_probe.text

    # Member 3: Generate and publish plan, assert Arjun cannot see any canary or HR phrases in plan
    client.post("/api/plan/generate", json={"project_id": "campusconnect"}, headers={"X-User-Id": "maya"})
    client.post("/api/plan/publish", json={"project_id": "campusconnect", "acknowledge_warnings": True}, headers={"X-User-Id": "maya"})

    res_plan = client.get("/api/plan", headers={"X-User-Id": "arjun"})
    assert res_plan.status_code == 200
    plan_body = res_plan.text
    assert canary_l3 not in plan_body, "Canary Level 3 leaked in /api/plan to Arjun!"
    assert canary_l2 not in plan_body, "Canary Level 2 leaked in /api/plan to Arjun!"
    for phrase in hr_sensitive_phrases:
        assert phrase not in plan_body, f"HR confidential phrase '{phrase}' leaked in /api/plan to Arjun!"

    # Arjun calling preview gets 403 with no leaks
    res_prev_leak = client.get("/api/preview?mode=draft", headers={"X-User-Id": "arjun"})
    assert res_prev_leak.status_code == 403
    assert canary_l3 not in res_prev_leak.text
    assert canary_l2 not in res_prev_leak.text


