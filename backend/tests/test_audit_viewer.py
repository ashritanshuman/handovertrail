import csv
import io
import uuid
from app.models import AuditLog


def test_audit_log_backward_compatibility(client):
    # Load demo and approve
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})
    client.patch(
        "/api/claims/clm-004",
        json={"review_state": "confirmed", "note": "PCI confirmed"},
        headers={"X-User-Id": "maya"},
    )

    # Calling GET /api/audit with no query parameters returns List[AuditLogDetailRead]
    res = client.get("/api/audit", headers={"X-User-Id": "maya"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0

    first = data[0]
    # Existing fields remain
    assert "id" in first
    assert "user_id" in first
    assert "action" in first
    assert "target_type" in first
    assert "target_id" in first
    assert "timestamp" in first
    # New additive fields present
    assert "actor" in first
    assert "entity" in first
    assert "summary" in first


def test_audit_log_filtering_and_search(client):
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    # Perform distinct actions
    client.patch(
        "/api/claims/clm-004",
        json={"review_state": "confirmed", "note": "SpecialPCIKeyWord"},
        headers={"X-User-Id": "maya"},
    )
    client.post(
        "/api/approve",
        json={"project_id": "campusconnect", "notes": "Handover signoff", "acknowledge_unresolved": True},
        headers={"X-User-Id": "maya"},
    )

    # 1. Filter by actor=maya
    res_actor = client.get("/api/audit?actor=maya", headers={"X-User-Id": "maya"})
    assert res_actor.status_code == 200
    for item in res_actor.json():
        assert item["actor"] == "maya"

    # 2. Filter by action=REVIEW_CLAIM
    res_act = client.get("/api/audit?action=REVIEW_CLAIM", headers={"X-User-Id": "maya"})
    assert res_act.status_code == 200
    assert len(res_act.json()) > 0
    for item in res_act.json():
        assert item["action"] == "REVIEW_CLAIM"

    # 3. Filter by entity=claim
    res_ent = client.get("/api/audit?entity=claim", headers={"X-User-Id": "maya"})
    assert res_ent.status_code == 200
    for item in res_ent.json():
        assert item["entity"] == "claim"

    # 4. Search q=SpecialPCIKeyWord
    res_q = client.get("/api/audit?q=SpecialPCIKeyWord", headers={"X-User-Id": "maya"})
    assert res_q.status_code == 200
    assert len(res_q.json()) >= 1
    assert any("clm-004" in item["entity_id"] for item in res_q.json())


def test_audit_log_pagination(client):
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    # Perform several edits to build audit log entries
    for i in range(5):
        client.patch(
            "/api/claims/clm-001",
            json={"review_state": "confirmed", "note": f"Edit step {i}"},
            headers={"X-User-Id": "maya"},
        )

    # Request with paginated=true and limit=2
    res_p1 = client.get("/api/audit?paginated=true&limit=2", headers={"X-User-Id": "maya"})
    assert res_p1.status_code == 200
    page1 = res_p1.json()
    assert "items" in page1
    assert "total" in page1
    assert len(page1["items"]) == 2
    assert page1["has_more"] is True
    assert page1["cursor"] is not None

    # Fetch page 2 using cursor
    cursor = page1["cursor"]
    res_p2 = client.get(f"/api/audit?paginated=true&limit=2&cursor={cursor}", headers={"X-User-Id": "maya"})
    assert res_p2.status_code == 200
    page2 = res_p2.json()
    assert len(page2["items"]) == 2
    # Ensure items on page 2 are different from page 1
    p1_ids = [it["id"] for it in page1["items"]]
    p2_ids = [it["id"] for it in page2["items"]]
    assert not set(p1_ids).intersection(set(p2_ids))


def test_audit_export_csv_and_formula_protection(client):
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    # Plant a formula injection attempt through claim patch API
    res_patch = client.patch(
        "/api/claims/clm-004",
        json={
            "review_state": "confirmed",
            "note": "=SUM(1,2)*cmd|' /C calc'!A0",
            "text": "+MALICIOUS_CMD_PAYLOAD",
        },
        headers={"X-User-Id": "maya"},
    )
    assert res_patch.status_code == 200

    # Call export endpoint
    res_export = client.get("/api/audit/export?format=csv", headers={"X-User-Id": "maya"})
    assert res_export.status_code == 200
    assert "text/csv" in res_export.headers["content-type"]
    assert "attachment;" in res_export.headers.get("content-disposition", "")

    csv_text = res_export.text
    reader = csv.reader(io.StringIO(csv_text))
    rows = list(reader)
    assert len(rows) > 1

    header = rows[0]
    assert "Audit ID" in header
    assert "Summary" in header
    assert "Reason / Note" in header

    # Find the malicious row and verify prefixing with single quote
    inj_row = next((r for r in rows if "clm-004" in r[5]), None)
    assert inj_row is not None
    # Note column: '=SUM(1,2)...' should be escaped to "'=SUM(1,2)..."
    note_cell = inj_row[7]
    assert note_cell.startswith("'=") or note_cell.startswith("'")


def test_canary_leak_protection_audit(client):
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    canary_l3 = "CANARY-LEVEL3-DO-NOT-LEAK"
    canary_l2 = "CANARY-LEVEL2-HR"

    # Lead Maya queries audit viewer and export
    res_audit_m = client.get("/api/audit?paginated=true", headers={"X-User-Id": "maya"})
    assert canary_l3 not in res_audit_m.text

    res_export_m = client.get("/api/audit/export?format=csv", headers={"X-User-Id": "maya"})
    assert canary_l3 not in res_export_m.text

    # Successor (Arjun) and Leaver (Riya) are denied access with 403
    for user in ["arjun", "riya"]:
        res_a = client.get("/api/audit", headers={"X-User-Id": user})
        assert res_a.status_code == 403
        assert canary_l3 not in res_a.text
        assert canary_l2 not in res_a.text

        res_exp = client.get("/api/audit/export?format=csv", headers={"X-User-Id": user})
        assert res_exp.status_code == 403
        assert canary_l3 not in res_exp.text
        assert canary_l2 not in res_exp.text
