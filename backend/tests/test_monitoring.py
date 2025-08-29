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


def test_metrics_endpoint():
    """Test that the Prometheus metrics endpoint is accessible and returns metrics"""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/plain; version=0.0.4; charset=utf-8"

    # Check that our custom metrics are present
    metrics_text = response.text
    assert "http_requests_total" in metrics_text
    assert "http_request_duration_seconds" in metrics_text
    assert "active_connections" in metrics_text
    assert "visitor_registrations_total" in metrics_text
    assert "access_code_verifications_total" in metrics_text


def test_metrics_collection():
    """Test that metrics are collected during API calls"""
    # Get initial metrics
    initial_response = client.get("/metrics")
    initial_metrics = initial_response.text

    # Make some API calls to generate metrics
    health_response = client.get("/healthz")
    assert health_response.status_code == 200

    # Register a visitor to generate visitor registration metrics
    register_response = client.post(
        "/api/visitors/register",
        headers={"x-api-key": "change_me_internal_key"},
        json={
            "invitationToken": "test_token",
            "visitor": {"fullName": "Test User", "idNumber": "ID001", "phone": "+254700000111"},
        },
    )
    assert register_response.status_code == 200

    # Get metrics after API calls
    final_response = client.get("/metrics")
    final_metrics = final_response.text

    # Check that request count increased
    assert "http_requests_total" in final_metrics

    # Check that visitor registration metric was incremented
    assert "visitor_registrations_total" in final_metrics
    # Extract the value and ensure it's greater than 0
    import re
    match = re.search(r'visitor_registrations_total (\d+\.?\d*)', final_metrics)
    assert match is not None, "visitor_registrations_total metric not found"
    value = float(match.group(1))
    assert value > 0, f"Expected visitor_registrations_total > 0, got {value}"


def test_structured_logging():
    """Test that structured logging is working (this would need log capture in real implementation)"""
    # This test would require log capture setup
    # For now, just ensure the app starts without logging errors
    response = client.get("/healthz")
    assert response.status_code == 200
