import pytest


def test_interview_session_retrieval(client):
    """
    Leaver Riya and Lead Maya can fetch structured interview session.
    Successor Arjun receives 403 Forbidden.
    """
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    # Riya (Leaver)
    res_riya = client.get("/api/interview", headers={"X-User-Id": "riya"})
    assert res_riya.status_code == 200
    data = res_riya.json()
    assert data["session_id"] == "interview-riya"
    assert data["leaver_name"] == "Riya Sharma"
    assert data["total_count"] >= 6
    assert data["answered_count"] >= 0
    assert len(data["questions"]) >= 6

    # Verify questions structure
    q1 = data["questions"][0]
    assert "quotes" in q1
    assert len(q1["quotes"]) >= 1
    assert "quick_options" in q1
    assert len(q1["quick_options"]) >= 2

    # Maya (Lead)
    res_maya = client.get("/api/interview", headers={"X-User-Id": "maya"})
    assert res_maya.status_code == 200

    # Arjun (Successor) -> 403
    res_arjun = client.get("/api/interview", headers={"X-User-Id": "arjun"})
    assert res_arjun.status_code == 403


def test_answer_interview_question_with_masking(client):
    """
    Answering interview question:
    - Masks any raw secrets/PII pre-storage.
    - Creates attributed EvidenceUnit with access_level=2.
    - Updates question state to 'answered'.
    - Logs 'interview_answered' audit event.
    - Updates interview progress counters.
    """
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    # Answer gap-001 with planted AWS key and secret note
    secret_key = "AKIAIOSFODNN7EXAMPLE"
    answer_text = f"Production runs on 90-day Vault TTL. Emergency root token was {secret_key} and phone +1 (555) 234-5678."
    payload = {"answer": answer_text}

    res_ans = client.post(
        "/api/interview/gap-001/answer",
        json=payload,
        headers={"X-User-Id": "riya"},
    )
    assert res_ans.status_code == 200
    ans_data = res_ans.json()
    assert ans_data["status"] == "answered"
    assert ans_data["question_id"] == "gap-001"
    # Secret must be masked in stored answer!
    assert secret_key not in ans_data["answer"]
    assert "[REDACTED" in ans_data["answer"]

    # Verify interview progress updated
    res_session = client.get("/api/interview", headers={"X-User-Id": "riya"})
    session_data = res_session.json()
    assert session_data["answered_count"] >= 1

    # Verify new attributed evidence unit was created at access_level=2
    res_ev = client.get("/api/evidence", headers={"X-User-Id": "maya"})
    ev_list = res_ev.json()
    interview_ev = next((e for e in ev_list if e.get("source_type") == "exit_interview"), None)
    assert interview_ev is not None
    assert interview_ev["access_level"] == 2
    assert secret_key not in interview_ev["text"]

    # Arjun (Clearance 1) must NEVER see the exit interview evidence!
    res_arjun_ev = client.get("/api/evidence", headers={"X-User-Id": "arjun"})
    arjun_ev_list = res_arjun_ev.json()
    assert not any(e["id"] == interview_ev["id"] for e in arjun_ev_list)

    # Verify audit log action 'interview_answered'
    res_audit = client.get("/api/audit", headers={"X-User-Id": "maya"})
    ans_logs = [l for l in res_audit.json() if l["action"] == "interview_answered" and l["target_id"] == "gap-001"]
    assert len(ans_logs) >= 1

    # Verify leaver answer is surfaced in GET /api/conflicts/cg-api-key-rotation
    res_conf = client.get("/api/conflicts/cg-api-key-rotation", headers={"X-User-Id": "maya"})
    assert res_conf.status_code == 200
    conf_data = res_conf.json()
    assert conf_data["leaver_answer"] is not None
    assert conf_data["leaver_answer"]["question_id"] == "gap-001"


def test_skip_interview_question(client):
    """
    Skipping an interview question:
    - Marks question state as 'skipped'.
    - Updates skipped_count in interview session.
    - Logs 'interview_skipped' audit event.
    """
    client.post("/api/demo/load", json={"force_reset": True}, headers={"X-User-Id": "maya"})

    payload = {"reason": "I do not recall the ticket drop configuration details."}
    res_skip = client.post(
        "/api/interview/gap-004/skip",
        json=payload,
        headers={"X-User-Id": "riya"},
    )
    assert res_skip.status_code == 200
    skip_data = res_skip.json()
    assert skip_data["status"] == "skipped"
    assert skip_data["question_id"] == "gap-004"

    # Check progress
    res_session = client.get("/api/interview", headers={"X-User-Id": "riya"})
    session_data = res_session.json()
    assert session_data["skipped_count"] >= 1

    # Check audit log
    res_audit = client.get("/api/audit", headers={"X-User-Id": "maya"})
    skip_logs = [l for l in res_audit.json() if l["action"] == "interview_skipped" and l["target_id"] == "gap-004"]
    assert len(skip_logs) >= 1
