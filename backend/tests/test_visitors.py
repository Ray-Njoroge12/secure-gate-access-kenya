import os, sys, pathlib
PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
APP_DIR = PROJECT_ROOT / 'app'
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))
from fastapi.testclient import TestClient
from app.main import app

os.environ.setdefault("INTERNAL_API_KEY", "change_me_internal_key")

client = TestClient(app)


def test_register_and_verify_flow():
    r = client.post(
        "/api/visitors/register",
        headers={"x-api-key": "change_me_internal_key"},
        json={
            "invitationToken": "tok1",
            "visitor": {"fullName": "Test User", "idNumber": "ID001", "phone": "+254700000111"},
        },
    )
    assert r.status_code == 200, r.text
    data = r.json()
    ac = data["access_code"]
    assert ac["qr_token"] is not None

    v = client.post(
        "/api/access-codes/verify",
        headers={"x-api-key": "change_me_internal_key"},
        json={"token": ac["qr_token"]},
    )
    assert v.status_code == 200
    body = v.json()
    assert body["ok"] is True
