import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from tests.pages.admin_accounts_page import AdminAccountsPage
from tests.pages.login_page import LoginPage


@pytest.mark.e2e
@pytest.mark.destructive
def test_double_click_creates_exactly_one_admin(driver, run_context):
    """One UI action, including an immediate second click, must yield one user row."""
    settings, db, data = run_context["settings"], run_context["db"], run_context["data"]
    email = f"{data.slug}.double-click@example.test"
    LoginPage(driver, settings.base_url).login(settings.commander_email, settings.commander_password, "/commander")
    page = AdminAccountsPage(driver, settings.base_url)
    page.open("/admins")
    WebDriverWait(driver, 20).until(lambda current: current.find_elements(By.CSS_SELECTOR, "[data-testid='admin-name']"))
    page.fill((By.CSS_SELECTOR, "[data-testid='admin-name']"), f"{data.run_id} Double Click")
    page.fill((By.CSS_SELECTOR, "[data-testid='admin-email']"), email)
    page.fill((By.CSS_SELECTOR, "[data-testid='admin-password']"), data.password)
    button = page.clickable((By.CSS_SELECTOR, "[data-testid='create-admin']"))
    button.click()
    # This is deliberately immediate. A disabled control suppresses it; the DB is the final authority.
    driver.execute_script("arguments[0].click();", button)
    WebDriverWait(driver, 20).until(lambda _driver: db.scalar("SELECT COUNT(*) FROM users WHERE email=%s", (email,)) == 1)
    assert db.scalar("SELECT COUNT(*) FROM users WHERE email=%s", (email,)) == 1
