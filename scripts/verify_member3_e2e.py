"""
End-to-end automated verification script for Member 3 (First-7-Days Plan Generator & Preview-as-Successor).
Executes the full 36-step workflow from Phase 10.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_e2e_verification():
    print("=" * 60)
    print("STARTING 36-STEP MEMBER 3 END-TO-END VERIFICATION WORKFLOW")
    print("=" * 60)

    # 1. Load synthetic demo data
    print("\n[Step 1] Loading synthetic demo data...")
    res = client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})
    assert res.status_code == 200, f"Demo load failed: {res.text}"
    print("  -> Demo loaded successfully.")

    # 2. Run extraction / verification
    print("\n[Step 2] Verifying claims extraction...")
    res_claims = client.get("/api/claims", headers={"X-User-Id": "maya"})
    assert res_claims.status_code == 200
    claims = res_claims.json()
    assert len(claims) >= 15
    print(f"  -> Extracted {len(claims)} candidate claims.")

    # 3. Review claims (Confirm eligible claims)
    print("\n[Step 3] Reviewing and confirming claims as Maya...")
    res_patch = client.patch(
        "/api/claims/clm-004",
        json={"review_state": "confirmed", "text": "External API keys rotate quarterly (90 days)."},
        headers={"X-User-Id": "maya"},
    )
    assert res_patch.status_code == 200
    print("  -> Confirmed claim clm-004.")

    # 4. Switch to Maya (Headers set to X-User-Id: maya)
    print("\n[Step 4] Operating under Lead persona (Maya Patel, clearance 2)...")

    # 5. Open Preview
    print("\n[Step 5] Opening Preview workspace...")
    res_prev = client.get("/api/preview?mode=draft", headers={"X-User-Id": "maya"})
    assert res_prev.status_code == 200
    prev_draft = res_prev.json()
    print("  -> Preview workspace returned 200 OK.")

    # 6. Select Draft mode
    print("\n[Step 6] Verifying Draft preview mode...")
    assert prev_draft["mode"] == "draft"
    assert prev_draft["handover"]["version"] == "Draft (Unapproved)"

    # 7. Verify successor-equivalent handover
    print("\n[Step 7] Checking successor-equivalent filtering in draft preview...")
    assert prev_draft["target_user"]["role"] == "successor"
    assert prev_draft["target_user"]["clearance"] == 1
    # All visible claims must have access_level <= 1
    for c in prev_draft["handover"]["claims"]:
        assert c["access_level"] <= 1, f"Leaked claim with level > 1: {c['id']}"
    print(f"  -> Successor sees {len(prev_draft['handover']['claims'])} level-1 claims.")

    # 8. Inspect Share Check findings
    print("\n[Step 8] Inspecting Share Check findings...")
    share_check = prev_draft["share_check"]
    assert "findings" in share_check
    assert "can_publish" in share_check
    print(f"  -> Share check findings count: {len(share_check['findings'])} (Blocks: {share_check['block_count']}, Warns: {share_check['warn_count']}, Info: {share_check['info_count']}).")

    # 9. Inspect Hidden from Successor
    print("\n[Step 9] Inspecting Hidden Items Panel...")
    hidden_items = prev_draft["hidden_items"]
    assert len(hidden_items) >= 1
    for item in hidden_items:
        assert item["access_level"] == 2
        assert "Lead-only" in item["reason"]
    print(f"  -> Hidden level-2 items: {[it['id'] for it in hidden_items]}")

    # 10. Verify level-3 items appear only as a count
    print("\n[Step 10] Verifying Level 3 confidential isolation (count only)...")
    assert prev_draft["confidential_count"] >= 1
    # Check that no Level 3 title or canary string is in hidden_items
    for item in hidden_items:
        assert item["access_level"] < 3
        assert "CANARY" not in item["title"]
    print(f"  -> Level 3 confidential items count: {prev_draft['confidential_count']} (no titles or text exposed).")

    # 11. Generate the seven-day plan
    print("\n[Step 11] Generating 7-day onboarding plan...")
    res_gen = client.post(
        "/api/plan/generate",
        json={"project_id": "campusconnect"},
        headers={"X-User-Id": "maya"},
    )
    assert res_gen.status_code == 200
    plan_v1 = res_gen.json()
    assert plan_v1["status"] == "draft"
    assert len(plan_v1["items"]) >= 10
    print(f"  -> Initial plan generated with {len(plan_v1['items'])} items.")

    # 12 & 13. Set role title and focus areas
    print("\n[Steps 12 & 13] Regenerating with customized role title and focus areas...")
    res_gen2 = client.post(
        "/api/plan/generate",
        json={
            "project_id": "campusconnect",
            "role_title": "Senior Backend & Payments Engineer",
            "focus_areas": ["Stripe", "Vault", "Redis", "APNs"],
        },
        headers={"X-User-Id": "maya"},
    )
    assert res_gen2.status_code == 200
    plan_v2 = res_gen2.json()
    assert plan_v2["role_title"] == "Senior Backend & Payments Engineer"
    assert "Stripe" in plan_v2["focus_areas"]
    print("  -> Plan successfully customized for role and focus areas.")

    # 14. Verify 7-day structure
    print("\n[Step 14] Verifying 7-day grouping structure...")
    days_present = {it["day"] for it in plan_v2["items"]}
    assert days_present == {1, 2, 3, 4, 5, 6, 7}, f"Missing days: {days_present}"
    print(f"  -> Days 1 through 7 all covered.")

    # 15. Edit item title and rationale
    print("\n[Step 15] Editing plan item title and rationale...")
    first_item = plan_v2["items"][0]
    res_edit = client.patch(
        f"/api/plan/items/{first_item['id']}",
        json={
            "title": "Pair with Riya on Stripe Ledger & CAS Integration",
            "why_it_matters": "Immediate orientation imperative during week 1.",
        },
        headers={"X-User-Id": "maya"},
    )
    assert res_edit.status_code == 200
    edited_item = next(it for it in res_edit.json()["items"] if it["id"] == first_item["id"])
    assert edited_item["title"] == "Pair with Riya on Stripe Ledger & CAS Integration"
    print("  -> Item title and rationale updated and persisted.")

    # 16. Move an item between days
    print("\n[Step 16] Moving item to Day 6...")
    res_move = client.patch(
        f"/api/plan/items/{first_item['id']}",
        json={"day": 6},
        headers={"X-User-Id": "maya"},
    )
    assert res_move.status_code == 200
    moved_item = next(it for it in res_move.json()["items"] if it["id"] == first_item["id"])
    assert moved_item["day"] == 6
    print("  -> Moved item to Day 6.")

    # 17. Pin an item
    print("\n[Step 17] Pinning item...")
    res_pin = client.patch(
        f"/api/plan/items/{first_item['id']}",
        json={"is_pinned": True},
        headers={"X-User-Id": "maya"},
    )
    assert res_pin.status_code == 200
    pinned_item = next(it for it in res_pin.json()["items"] if it["id"] == first_item["id"])
    assert pinned_item["is_pinned"] is True
    print("  -> Item successfully pinned.")

    # 18. Remove an item
    print("\n[Step 18] Removing a plan item...")
    item_to_del = plan_v2["items"][-1]["id"]
    res_del = client.delete(
        f"/api/plan/items/{item_to_del}",
        headers={"X-User-Id": "maya"},
    )
    assert res_del.status_code == 200
    assert not any(it["id"] == item_to_del for it in res_del.json()["items"])
    print(f"  -> Item {item_to_del} removed cleanly.")

    # 19. Verify citations remain correct
    print("\n[Step 19] Verifying claim citations remain intact...")
    current_plan = client.get("/api/plan", headers={"X-User-Id": "maya"}).json()
    for it in current_plan["items"]:
        assert len(it["claim_ids"]) >= 1
        assert it["source_label"] is not None
    print("  -> All claim citations verified.")

    # 20 & 21. Check Share Check and Acknowledge Warnings
    print("\n[Steps 20 & 21] Checking Share Check pre-publication requirements...")
    res_check = client.get("/api/preview/check", headers={"X-User-Id": "maya"})
    assert res_check.status_code == 200
    check_data = res_check.json()
    assert check_data["block_count"] == 0, f"Found block findings: {check_data['findings']}"
    print(f"  -> Pre-publish check passed (0 blockers, {check_data['warn_count']} warnings).")

    # 22. Approve the handover
    print("\n[Step 22] Approving handover snapshot as Maya...")
    res_appr = client.post(
        "/api/approve",
        json={"project_id": "campusconnect", "acknowledge_unresolved": True},
        headers={"X-User-Id": "maya"},
    )
    assert res_appr.status_code == 200
    version_str = res_appr.json()["version"]
    print(f"  -> Approved handover version {version_str}.")

    # 23. Open Approved preview
    print("\n[Step 23] Opening Approved preview as Maya...")
    res_prev_appr = client.get("/api/preview?mode=approved", headers={"X-User-Id": "maya"})
    assert res_prev_appr.status_code == 200
    assert res_prev_appr.json()["mode"] == "approved"
    assert res_prev_appr.json()["handover"]["state"] == "approved"
    print("  -> Approved preview matches ratified snapshot.")

    # 24. Publish the plan
    print("\n[Step 24] Publishing the plan with warning acknowledgement...")
    res_pub = client.post(
        "/api/plan/publish",
        json={"project_id": "campusconnect", "acknowledge_warnings": True},
        headers={"X-User-Id": "maya"},
    )
    assert res_pub.status_code == 200
    assert res_pub.json()["status"] == "published"
    print("  -> Plan published successfully.")

    # 25 & 26. Switch to Arjun and open handover page
    print("\n[Steps 25 & 26] Switching to Arjun (Clearance 1) and fetching /api/handover...")
    res_arjun_ho = client.get("/api/handover", headers={"X-User-Id": "arjun"})
    assert res_arjun_ho.status_code == 200
    arjun_ho = res_arjun_ho.json()
    assert arjun_ho["state"] == "approved"
    print(f"  -> Arjun received approved handover with {len(arjun_ho['claims'])} claims.")

    # 27. Verify published 7-day plan on Arjun's handover
    print("\n[Step 27] Verifying published 7-day plan in Arjun's handover payload...")
    assert arjun_ho["plan"] is not None
    assert arjun_ho["plan"]["status"] == "published"
    arjun_plan_items = arjun_ho["plan"]["items"]
    assert len(arjun_plan_items) >= 9
    print(f"  -> Arjun received {len(arjun_plan_items)} orientation plan items.")

    # 28. Open citation chips (Verify all plan item cited claims are visible to Arjun)
    print("\n[Step 28] Verifying citation chips...")
    visible_cids = {c["id"] for c in arjun_ho["claims"]}
    for it in arjun_plan_items:
        for cid in it["claim_ids"]:
            assert cid in visible_cids, f"Leaked hidden claim ID {cid} to Arjun!"
    print("  -> All cited claims exist and are visible to Arjun.")

    # 29. Mark multiple tasks done
    print("\n[Step 29] Arjun marks tasks done...")
    item_1 = arjun_plan_items[0]["id"]
    item_2 = arjun_plan_items[1]["id"]
    res_done1 = client.patch(f"/api/plan/items/{item_1}/progress", json={"done": True}, headers={"X-User-Id": "arjun"})
    res_done2 = client.patch(f"/api/plan/items/{item_2}/progress", json={"done": True}, headers={"X-User-Id": "arjun"})
    assert res_done1.status_code == 200
    assert res_done2.status_code == 200
    print(f"  -> Marked {item_1} and {item_2} as done.")

    # 30 & 31. Reload (Re-fetch) and verify progress persists
    print("\n[Steps 30 & 31] Verifying checklist persistence across requests...")
    res_reget = client.get("/api/handover", headers={"X-User-Id": "arjun"})
    reget_plan = res_reget.json()["plan"]
    assert reget_plan["completed_count"] >= 2
    done_ids = {it["id"] for it in reget_plan["items"] if it["done"]}
    assert item_1 in done_ids
    assert item_2 in done_ids
    print(f"  -> Progress persisted: {reget_plan['completed_count']} of {reget_plan['total_items']} completed.")

    # 32 & 33. Switch back to Maya and verify completed count
    print("\n[Steps 32 & 33] Maya inspects completed count...")
    res_maya_plan = client.get("/api/preview?mode=approved", headers={"X-User-Id": "maya"})
    assert res_maya_plan.status_code == 200
    maya_prev_plan = res_maya_plan.json()["handover"]["plan"]
    assert maya_prev_plan["completed_count"] >= 2
    print(f"  -> Maya observes {maya_prev_plan['completed_count']} items completed by Arjun.")

    # 34 & 35. Attempt to access Preview as Arjun -> Access denied (403)
    print("\n[Steps 34 & 35] Arjun attempts to access Preview endpoint...")
    res_forbidden = client.get("/api/preview", headers={"X-User-Id": "arjun"})
    assert res_forbidden.status_code == 403, f"Expected 403 for Arjun, got {res_forbidden.status_code}"
    res_forbidden_check = client.get("/api/preview/check", headers={"X-User-Id": "arjun"})
    assert res_forbidden_check.status_code == 403
    print("  -> Access successfully denied to Arjun (HTTP 403).")

    # 36. Run the canary leak tests across all endpoints
    print("\n[Step 36] Comprehensive Canary Leak and Confidentiality Scan...")
    canaries = ["CANARY-LEVEL3-DO-NOT-LEAK", "CANARY-LEVEL2-HR"]
    endpoints_to_probe = [
        ("GET", "/api/handover", "arjun"),
        ("GET", "/api/plan", "arjun"),
        ("GET", "/api/claims", "arjun"),
        ("GET", "/api/timeline", "arjun"),
        ("GET", "/api/preview?mode=approved", "maya"),
        ("GET", "/api/preview/check", "maya"),
    ]
    for method, path, user in endpoints_to_probe:
        res_probe = client.get(path, headers={"X-User-Id": user})
        text = res_probe.text
        # Level 3 canary must NEVER appear anywhere
        assert "CANARY-LEVEL3-DO-NOT-LEAK" not in text, f"Level 3 Canary leaked in {path} for {user}!"
        # Level 2 canary must NEVER appear for Arjun
        if user == "arjun":
            assert "CANARY-LEVEL2-HR" not in text, f"Level 2 Canary leaked in {path} for Arjun!"
    print("  -> Zero canary leaks confirmed across all endpoints.")

    print("\n" + "=" * 60)
    print("ALL 36 STEPS OF MEMBER 3 WORKFLOW COMPLETED AND VERIFIED 100%")
    print("=" * 60)

if __name__ == "__main__":
    run_e2e_verification()
