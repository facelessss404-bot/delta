import pytest
from selenium.webdriver.support.ui import WebDriverWait

from tests.pages.login_page import LoginPage
from tests.pages.results_page import ResultsPage


def _require_role_credentials(settings) -> None:
    if not all((settings.admin_email, settings.admin_password, settings.cadet_email, settings.cadet_password)):
        pytest.skip("Results E2E requires TEST_ADMIN_* and TEST_CADET_* credentials for the isolated database.")


@pytest.mark.e2e
@pytest.mark.destructive
def test_results_create_read_update_delete_across_roles(driver, run_context):
    settings, db, data = run_context["settings"], run_context["db"], run_context["data"]
    _require_role_credentials(settings)
    cadet = db.one("SELECT id FROM users WHERE email=%s", (settings.cadet_email,))
    assert cadet, "Configured TEST_CADET_EMAIL must exist in the isolated test database."
    exam_name = f"{data.run_id} Results"
    first_remarks, second_remarks = "Initial automated score", "Updated automated score"
    login = LoginPage(driver, settings.base_url)
    page = ResultsPage(driver, settings.base_url)

    login.login(settings.commander_email, settings.commander_password, "/commander")
    page.create(exam_name)
    exam = db.one("SELECT id,max_marks FROM exams WHERE name=%s", (exam_name,))
    assert exam and int(exam["max_marks"]) == 100
    page.select_exam(exam["id"])
    page.save_result(cadet["id"], "72", first_remarks)
    result = db.one("SELECT id,marks_obtained,remarks FROM results WHERE exam_id=%s AND cadet_id=%s", (exam["id"], cadet["id"]))
    assert result and float(result["marks_obtained"]) == 72 and result["remarks"] == first_remarks
    page.save_result(cadet["id"], "88.5", second_remarks)
    result = db.one("SELECT id,marks_obtained,remarks FROM results WHERE exam_id=%s AND cadet_id=%s", (exam["id"], cadet["id"]))
    assert result and float(result["marks_obtained"]) == 88.5 and result["remarks"] == second_remarks
    login.logout()

    login.login(settings.cadet_email, settings.cadet_password, "/cadet")
    driver.get(f"{settings.base_url}/results")
    WebDriverWait(driver, 20).until(lambda current: exam_name in current.page_source and second_remarks in current.page_source and "88.5" in current.page_source)
    login.logout()

    login.login(settings.admin_email, settings.admin_password, "/admin")
    page.open("/results")
    page.select_exam(exam["id"])
    page.delete_result(result["id"])
    assert db.scalar("SELECT COUNT(*) FROM results WHERE id=%s", (result["id"],)) == 0
    login.logout()
