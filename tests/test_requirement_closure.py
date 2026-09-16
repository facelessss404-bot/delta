"""Regression coverage for the requirement gaps closed after the implementation audit."""
import pytest
from selenium.webdriver.support.ui import WebDriverWait

from tests.pages.login_page import LoginPage


@pytest.mark.e2e
@pytest.mark.destructive
def test_commander_can_open_cadet_management_and_staff_can_read_session_records(driver, run_context):
    settings = run_context["settings"]
    login = LoginPage(driver, settings.base_url)
    login.login(settings.commander_email, settings.commander_password, "/commander")
    driver.get(f"{settings.base_url}/admin")
    WebDriverWait(driver, 20).until(lambda current: current.current_url == f"{settings.base_url}/admin" and "Cadet roster" in current.page_source)

    status = driver.execute_async_script("""
      const done = arguments[arguments.length - 1];
      fetch(arguments[0] + '/attendance/sessions/999999999/records', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      }).then(response => done(response.status)).catch(error => done('fetch-error:' + error));
    """, settings.api_base_url)
    assert status == 200
