import os, sys, pathlib
PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
os.environ.setdefault("INTERNAL_API_KEY", "change_me_internal_key")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_app.db")

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402

client = TestClient(app)


def test_generate_access_code_for_existing_visitor():
    r = client.post(
        "/api/visitors/register",
        headers={"x-api-key": "change_me_internal_key"},
        json={"invitationToken": None, "visitor": {"fullName": "User A", "idNumber": "IDX1", "phone": "+254700000222"}},
    )
    assert r.status_code == 200
    v_id = r.json()["visitor"]["id"]
    g = client.post(
        "/api/access-codes/generate",
        headers={"x-api-key": "change_me_internal_key"},
        json={"visitorId": v_id},
    )
    assert g.status_code == 200, g.text
    body = g.json()
    assert body["qr_token"] is not None


def test_pin_verification_flow():
    # dev mode skip QR, use PIN path
    os.environ["ACCESS_CODE_MODE"] = "dev"
    r = client.post(
        "/api/visitors/register",
        headers={"x-api-key": "change_me_internal_key"},
        json={"invitationToken": None, "visitor": {"fullName": "User B", "idNumber": "IDX2", "phone": "+254700000333"}},
    )
    assert r.status_code == 200
    ac = r.json()["access_code"]
    # In dev mode token may be null, regenerate explicitly
    v_id = r.json()["visitor"]["id"]
    gen = client.post(
        "/api/access-codes/generate",
        headers={"x-api-key": "change_me_internal_key"},
        json={"visitorId": v_id, "mode": "dev"},
    )
    assert gen.status_code == 200
    pin = gen.json()["pin"]
    verify = client.post(
        "/api/access-codes/verify",
        headers={"x-api-key": "change_me_internal_key"},
        json={"pin": pin},
    )
    assert verify.status_code == 200
    assert verify.json()["ok"] is True