from __future__ import annotations

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from tests.pages.academics_page import AcademicsPage
from tests.pages.admin_accounts_page import AdminAccountsPage
from tests.pages.admin_dashboard_page import AdminDashboardPage
from tests.pages.attendance_page import AttendancePage
from tests.pages.engagement_pages import LeavePage, NoticeBoardPage, SettingsPage
from tests.pages.login_page import LoginPage


@pytest.mark.e2e
@pytest.mark.destructive
def test_commander_admin_cadet_data_flow(driver, run_context):
    """Real UI actions are checked against the exact PostgreSQL rows they create."""
    settings, db, data = run_context["settings"], run_context["db"], run_context["data"]
    subject_id = db.insert_subject(data.subject_name)

    login = LoginPage(driver, settings.base_url)
    login.login(settings.commander_email, settings.commander_password, "/commander")
    AdminAccountsPage(driver, settings.base_url).create_admin(data.admin_name, data.admin_email, data.password)
    admin = db.one("SELECT id, role FROM users WHERE email=%s", (data.admin_email,))
    assert admin and admin["role"] == "admin"
    login.logout()

    login.login(data.admin_email, data.password, "/admin")
    AdminDashboardPage(driver, settings.base_url).create_cadet(data.cadet_name, data.cadet_email, data.password, subject_id)
    cadet = db.one("SELECT u.id, p.status FROM users u JOIN cadet_profiles p ON p.user_id=u.id WHERE u.email=%s", (data.cadet_email,))
    assert cadet and cadet["status"] == "active"
    assert db.scalar("SELECT COUNT(*) FROM subject_assignments WHERE cadet_id=%s AND subject_id=%s", (cadet["id"], subject_id)) == 1
    other_email = f"{data.slug}.other-cadet@example.test"
    other_name = f"{data.run_id} Other Cadet"
    AdminDashboardPage(driver, settings.base_url).create_cadet(other_name, other_email, data.password, subject_id)
    other_cadet = db.one("SELECT id FROM users WHERE email=%s", (other_email,))
    assert other_cadet

    AcademicsPage(driver, settings.base_url).create_assessment_and_mark(subject_id, data.assessment_title, cadet["id"], "85")
    mark = db.one("SELECT m.marks, a.max_marks FROM assessment_marks m JOIN assessments a ON a.id=m.assessment_id WHERE a.title=%s AND m.cadet_id=%s", (data.assessment_title, cadet["id"]))
    assert mark and float(mark["marks"]) == 85 and float(mark["max_marks"]) == 100

    AttendancePage(driver, settings.base_url).create_and_mark_present(subject_id, data.cadet_name)
    attendance = db.one("SELECT r.status, s.subject_id FROM attendance_session_records r JOIN attendance_sessions s ON s.id=r.session_id WHERE r.cadet_id=%s AND s.subject_id=%s ORDER BY r.id DESC LIMIT 1", (cadet["id"], subject_id))
    assert attendance == {"status": "present", "subject_id": subject_id}
    notice_title = f"{data.run_id} Urgent notice"
    NoticeBoardPage(driver, settings.base_url).publish_urgent(notice_title, "Automated cross-role notification check.")
    assert db.scalar("SELECT COUNT(*) FROM notices WHERE title=%s", (notice_title,)) == 1
    assert db.scalar("SELECT COUNT(*) FROM notifications WHERE user_id=%s AND title=%s", (cadet["id"], notice_title)) == 1
    driver.get(f"{settings.base_url}/audit-logs")
    WebDriverWait(driver, 20).until(lambda current: "attendance_record.created" in current.page_source)
    driver.get(f"{settings.base_url}/reports")
    WebDriverWait(driver, 20).until(lambda current: "Operational reports" in current.page_source)
    expected_assessments = str(db.scalar("SELECT COUNT(*) FROM assessments"))
    report_assessments = driver.find_element(By.XPATH, "//p[normalize-space()='Assessments']/preceding-sibling::p").text
    assert report_assessments == expected_assessments
    login.logout()

    login.login(data.cadet_email, data.password, "/cadet")
    WebDriverWait(driver, 20).until(lambda current: data.subject_name in current.page_source)
    driver.get(f"{settings.base_url}/academics")
    WebDriverWait(driver, 20).until(lambda current: data.assessment_title in current.page_source and "85.00/100.00" in current.page_source)
    driver.get(f"{settings.base_url}/attendance")
    WebDriverWait(driver, 20).until(lambda current: data.subject_name in current.page_source and "present" in current.page_source.lower())
    expected_percentage = str(db.scalar("SELECT percentage FROM (SELECT COALESCE(ROUND(100.0 * COUNT(*) FILTER (WHERE status='present') / NULLIF(COUNT(*), 0), 1), 0) AS percentage FROM attendance_session_records WHERE cadet_id=%s) summary", (cadet["id"],)))
    assert f"{expected_percentage}%" in driver.page_source
    driver.get(f"{settings.base_url}/notifications")
    WebDriverWait(driver, 20).until(lambda current: notice_title in current.page_source)
    notification = driver.find_element(By.XPATH, f"//p[normalize-space()={notice_title!r}]/ancestor::button")
    driver.execute_script("arguments[0].scrollIntoView({block: 'center', behavior: 'instant'}); arguments[0].click();", notification)
    WebDriverWait(driver, 20).until(lambda _current: db.scalar("SELECT read_at IS NOT NULL FROM notifications WHERE user_id=%s AND title=%s", (cadet["id"], notice_title)) is True)
    SettingsPage(driver, settings.base_url).disable_email_notifications()
    WebDriverWait(driver, 20).until(lambda _current: db.scalar("SELECT email_notifications FROM user_settings WHERE user_id=%s", (cadet["id"],)) is False)
    leave_reason = f"{data.run_id} leave request"
    LeavePage(driver, settings.base_url).request_leave("2027-01-10", "2027-01-12", leave_reason)
    assert db.scalar("SELECT COUNT(*) FROM leaves WHERE cadet_id=%s AND reason=%s AND status='pending'", (cadet["id"], leave_reason)) == 1
    login.logout()

    login.login(data.admin_email, data.password, "/admin")
    leave_id = db.scalar("SELECT id FROM leaves WHERE cadet_id=%s AND reason=%s", (cadet["id"], leave_reason))
    review_status = driver.execute_async_script("""
      const done = arguments[arguments.length - 1];
      fetch(arguments[0] + '/leaves/' + arguments[1] + '/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ status: 'approved', reviewer_remarks: 'Verified by automated E2E' })
      }).then(response => done(response.status)).catch(error => done('fetch-error:' + error));
    """, settings.api_base_url, leave_id)
    assert review_status == 200
    driver.get(f"{settings.base_url}/leaves")
    WebDriverWait(driver, 20).until(lambda current: "approved" in current.page_source.lower())
    assert db.scalar("SELECT status FROM leaves WHERE cadet_id=%s AND reason=%s", (cadet["id"], leave_reason)) == "approved"
    assert db.scalar("SELECT COUNT(*) FROM notifications WHERE user_id=%s AND title='Leave request updated'", (cadet["id"],)) == 1
    login.logout()

    login.login(data.cadet_email, data.password, "/cadet")
    driver.get(f"{settings.base_url}/notifications")
    WebDriverWait(driver, 20).until(lambda current: "Leave request updated" in current.page_source)
    # Direct API access is checked as well as route navigation: a cadet must not retrieve another cadet.
    status = driver.execute_async_script("""
      const done = arguments[arguments.length - 1];
      fetch(arguments[0] + '/cadets/' + arguments[1], {headers: {Authorization: 'Bearer ' + localStorage.getItem('token')}})
        .then(response => done(response.status)).catch(error => done('fetch-error:' + error));
    """, settings.api_base_url, other_cadet["id"])
    assert status == 403
    driver.get(f"{settings.base_url}/admin")
    WebDriverWait(driver, 20).until(lambda current: current.current_url == f"{settings.base_url}/")
