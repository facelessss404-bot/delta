import pytest

from tests.pages.login_page import LoginPage
from tests.pages.subjects_page import SubjectsPage


@pytest.mark.e2e
@pytest.mark.destructive
def test_commander_subject_crud_and_duplicate_validation(driver, run_context):
    settings, db, data = run_context["settings"], run_context["db"], run_context["data"]
    initial_name = f"{data.run_id} Subject CRUD"
    updated_name = f"{data.run_id} Subject Updated"
    LoginPage(driver, settings.base_url).login(settings.commander_email, settings.commander_password, "/commander")
    page = SubjectsPage(driver, settings.base_url)
    page.create(initial_name, f"CRUD-{data.run_id[-8:]}")
    subject = db.one("SELECT id,name,code,active FROM subjects WHERE name=%s", (initial_name,))
    assert subject and subject["active"] is True
    page.edit(subject["id"], updated_name, f"EDIT-{data.run_id[-8:]}")
    assert db.one("SELECT name,code FROM subjects WHERE id=%s", (subject["id"],)) == {"name": updated_name, "code": f"EDIT-{data.run_id[-8:]}"}
    page.create(updated_name, f"DUP-{data.run_id[-8:]}", expected_message="already exists")
    assert "already exists" in page.visible(page.message).text
    assert db.scalar("SELECT COUNT(*) FROM subjects WHERE name=%s", (updated_name,)) == 1
    page.delete(subject["id"])
    assert db.scalar("SELECT COUNT(*) FROM subjects WHERE id=%s", (subject["id"],)) == 0
