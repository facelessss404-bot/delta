from __future__ import annotations

import pytest
from selenium.webdriver.support.ui import WebDriverWait

from tests.pages.login_page import LoginPage


@pytest.mark.security
@pytest.mark.destructive
def test_admin_cannot_open_commander_only_admin_accounts(driver, run_context):
    settings = run_context["settings"]
    if not settings.admin_email or not settings.admin_password:
        pytest.skip("Security restriction test requires the seeded isolated TEST_ADMIN credentials.")
    # The permission assertion is browser navigation through the frontend route guard.
    LoginPage(driver, settings.base_url).login(settings.admin_email, settings.admin_password, "/admin")
    driver.get(f"{settings.base_url}/admins")
    WebDriverWait(driver, 20).until(lambda current: current.current_url == f"{settings.base_url}/")
    assert "Personnel Login" in driver.page_source
