from pathlib import Path

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from tests.pages.base_page import BasePage
from tests.pages.login_page import LoginPage


@pytest.mark.e2e
@pytest.mark.destructive
def test_commander_cadet_notes_upload_download_delete_ui(driver, run_context):
    """Exercise the Notes UI with a harmless local PDF and verify its persisted row."""
    settings, db, data = run_context["settings"], run_context["db"], run_context["data"]
    title = f"{data.run_id} Browser Note"
    fixture = Path(__file__).parent / "fixtures" / "automated-note.pdf"
    login = LoginPage(driver, settings.base_url)

    login.login(settings.commander_email, settings.commander_password, "/commander")
    driver.get(f"{settings.base_url}/notes")
    wait = WebDriverWait(driver, 25)
    wait.until(lambda current: current.find_elements(By.XPATH, "//button[contains(., 'Upload material') ]"))
    BasePage(driver, settings.base_url).activate((By.XPATH, "//button[contains(., 'Upload material') ]"))
    wait.until(lambda current: current.find_elements(By.CSS_SELECTOR, "input[placeholder='Document Title']"))
    page = BasePage(driver, settings.base_url)
    page.fill((By.CSS_SELECTOR, "input[placeholder='Document Title']"), title)
    driver.find_element(By.CSS_SELECTOR, "input[type='file']").send_keys(str(fixture.resolve()))
    page.activate((By.XPATH, "//button[@type='submit' and contains(., 'Upload Material')]"))
    wait.until(lambda current: title in current.page_source)
    note_id = db.scalar("SELECT id FROM notes WHERE title=%s", (title,))
    assert note_id

    login.logout()
    login.login(settings.cadet_email, settings.cadet_password, "/cadet")
    driver.get(f"{settings.base_url}/notes")
    wait.until(lambda current: title in current.page_source)
    driver.find_element(By.XPATH, f"//article[.//h2[normalize-space()={title!r}]]//button[contains(., 'Download')]").click()

    login.logout()
    login.login(settings.commander_email, settings.commander_password, "/commander")
    driver.get(f"{settings.base_url}/notes")
    wait.until(lambda current: title in current.page_source)
    delete = driver.find_element(By.XPATH, f"(//article[.//h2[normalize-space()={title!r}]]//button)[2]")
    driver.execute_script("window.confirm = () => true; arguments[0].click();", delete)
    wait.until(lambda _current: db.scalar("SELECT COUNT(*) FROM notes WHERE id=%s", (note_id,)) == 0)
