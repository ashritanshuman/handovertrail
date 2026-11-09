from fastapi.testclient import TestClient
from app.main import app

def test_frontend_serving():
    client = TestClient(app)
    # Root route serves index.html
    res = client.get("/")
    assert res.status_code == 200
    assert "<!DOCTYPE html>" in res.text or "<div id=\"root\">" in res.text

    # Client-side routes serve index.html (SPA catch-all)
    for route in ["/dashboard", "/review", "/timeline", "/gaps", "/handover"]:
        r = client.get(route)
        assert r.status_code == 200
        assert "<div id=\"root\">" in r.text

