import pytest
from selenium.webdriver.support.ui import WebDriverWait

from tests.pages.login_page import LoginPage


def _credentials_or_skip(settings, role: str) -> tuple[str, str]:
    email, password = getattr(settings, f"{role}_email"), getattr(settings, f"{role}_password")
    if not email or not password:
        pytest.skip(f"Dedicated {role} authentication E2E requires TEST_{role.upper()}_EMAIL and TEST_{role.upper()}_PASSWORD.")
    return email, password


@pytest.mark.smoke
def test_admin_invalid_login_refresh_and_logout(driver, run_context):
    settings = run_context["settings"]
    email, password = _credentials_or_skip(settings, "admin")
    login = LoginPage(driver, settings.base_url)
    assert "Invalid email or password" in login.invalid_login(email, "DefinitelyWrong!9")
    login.login(email, password, "/admin")
    WebDriverWait(driver, 20).until(lambda current: "Cadet roster" in current.page_source)
    driver.refresh()
    login.wait.until(lambda current: current.current_url == f"{settings.base_url}/admin")
    WebDriverWait(driver, 20).until(lambda current: "Cadet roster" in current.page_source)
    login.logout()
    assert driver.execute_script("return localStorage.getItem('token')") is None


@pytest.mark.smoke
def test_cadet_invalid_login_refresh_and_logout(driver, run_context):
    settings = run_context["settings"]
    email, password = _credentials_or_skip(settings, "cadet")
    login = LoginPage(driver, settings.base_url)
    assert "Invalid email or password" in login.invalid_login(email, "DefinitelyWrong!9")
    login.login(email, password, "/cadet")
    WebDriverWait(driver, 20).until(lambda current: "Cadet portal" in current.page_source)
    driver.refresh()
    login.wait.until(lambda current: current.current_url == f"{settings.base_url}/cadet")
    WebDriverWait(driver, 20).until(lambda current: "Cadet portal" in current.page_source)
    login.logout()
    assert driver.execute_script("return localStorage.getItem('token')") is None
