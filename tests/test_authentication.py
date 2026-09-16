import pytest
from selenium.webdriver.support.ui import WebDriverWait

from tests.pages.login_page import LoginPage


@pytest.mark.smoke
def test_commander_login_refresh_and_logout(driver, run_context):
    settings = run_context["settings"]
    login = LoginPage(driver, settings.base_url)
    login.login(settings.commander_email, settings.commander_password, "/commander")
    assert "Command operations" in driver.page_source
    driver.refresh()
    login.wait.until(lambda current: "/commander" in current.current_url)
    WebDriverWait(driver, 20).until(lambda current: "Training Commander" in current.page_source)
    login.logout()


@pytest.mark.smoke
def test_invalid_credentials_show_real_backend_error(driver, run_context):
    settings = run_context["settings"]
    message = LoginPage(driver, settings.base_url).invalid_login("missing.user@example.test", "NotThePassword!9")
    assert "Invalid email or password" in message


@pytest.mark.security
def test_anonymous_protected_route_redirects_to_login(driver, run_context):
    settings = run_context["settings"]
    driver.get(f"{settings.base_url}/commander")
    LoginPage(driver, settings.base_url).wait.until(lambda current: current.current_url == f"{settings.base_url}/")
