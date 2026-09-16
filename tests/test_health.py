import requests
import pytest


@pytest.mark.smoke
def test_application_and_database_health(run_context):
    settings = run_context["settings"]
    response = requests.get(f"{settings.api_base_url}/health", timeout=20)
    assert response.status_code == 200, response.text
    assert response.json()["ok"] is True
    assert response.headers.get("Server-Timing", "").startswith("app;dur="), "Every API response must expose application timing."
    assert run_context["db"].scalar("SELECT 1") == 1
