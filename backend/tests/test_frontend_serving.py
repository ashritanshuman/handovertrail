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

    # Static files must return 200 and not fall back to index.html
    fav_res = client.get("/favicon.png")
    assert fav_res.status_code == 200
    assert "image/png" in fav_res.headers.get("content-type", "")
    assert not fav_res.text.startswith("<!DOCTYPE html>")
    assert len(fav_res.content) > 1000

    manifest_res = client.get("/site.webmanifest")
    assert manifest_res.status_code == 200
    assert not manifest_res.text.startswith("<!DOCTYPE html>")

