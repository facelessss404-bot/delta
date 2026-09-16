"""End-to-end API/data checks for operations without a dedicated UI editor."""
from __future__ import annotations

import requests

import pytest


def _login(settings, email: str, password: str) -> dict[str, str]:
    response = requests.post(f"{settings.api_base_url}/auth/login", json={"email": email, "password": password}, timeout=20)
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['token']}"}


def _json(response: requests.Response, status: int):
    assert response.status_code == status, response.text
    return response.json() if response.content else None


@pytest.mark.e2e
@pytest.mark.destructive
def test_remaining_non_video_services_with_isolated_dummy_data(run_context):
    settings, db, data = run_context["settings"], run_context["db"], run_context["data"]
    commander = _login(settings, settings.commander_email, settings.commander_password)
    admin = _login(settings, settings.admin_email, settings.admin_password)

    # Public counselling registration and staff-only retrieval.
    registration = _json(requests.post(f"{settings.api_base_url}/counselling-registrations", json={
        "fullName": f"{data.run_id} Applicant", "phone": "+91 98765 43210", "email": f"{data.slug}.applicant@example.test",
        "dobOrAge": "18", "educationLevel": "College", "program": "JLP", "mode": "video",
        "additionalNotes": data.run_id, "consent": True,
    }, timeout=20), 200)
    registration_row = db.one("SELECT full_name,program,mode,consent FROM counselling_registrations WHERE reference_id=%s", (registration["reference_id"],))
    assert registration_row == {"full_name": f"{data.run_id} Applicant", "program": "JLP", "mode": "video", "consent": True}
    registrations = _json(requests.get(f"{settings.api_base_url}/counselling-registrations", headers=commander, timeout=20), 200)
    assert any(item["reference_id"] == registration["reference_id"] for item in registrations)

    # Commander creates then deletes an admin account; the database role is checked both ways.
    temp_admin_email = f"{data.slug}.matrix-admin@example.test"
    created_admin = _json(requests.post(f"{settings.api_base_url}/admins", headers=commander, json={"name": f"{data.run_id} Matrix Admin", "email": temp_admin_email, "password": data.password}, timeout=20), 201)
    assert db.one("SELECT role FROM users WHERE id=%s", (created_admin["id"],)) == {"role": "admin"}
    _json(requests.delete(f"{settings.api_base_url}/admins/{created_admin['id']}", headers=commander, timeout=20), 200)
    assert db.scalar("SELECT COUNT(*) FROM users WHERE id=%s", (created_admin["id"],)) == 0

    # Backend-only cadet update/assignment, session attendance, academic mark PATCH, and individual report.
    subject = _json(requests.post(f"{settings.api_base_url}/subjects", headers=commander, json={"name": f"{data.run_id} Matrix Subject", "code": "MATRIX", "category": "academic", "active": True}, timeout=20), 201)
    cadet_email = f"{data.slug}.matrix-cadet@example.test"
    cadet = _json(requests.post(f"{settings.api_base_url}/auth/register", headers=commander, json={"name": f"{data.run_id} Matrix Cadet", "email": cadet_email, "password": data.password, "role": "cadet"}, timeout=20), 201)
    cadet_id = cadet["id"]
    updated = _json(requests.patch(f"{settings.api_base_url}/cadets/{cadet_id}", headers=admin, json={"name": f"{data.run_id} Updated Cadet", "rollNo": "AUTO-101", "batch": "2026", "programme": "JLP", "status": "active"}, timeout=20), 200)
    assert updated["roll_no"] == "AUTO-101"
    assert db.one("SELECT name FROM users WHERE id=%s", (cadet_id,)) == {"name": f"{data.run_id} Updated Cadet"}
    assert requests.put(f"{settings.api_base_url}/cadets/{cadet_id}/subjects", headers=admin, json={"subjectIds": [subject["id"]], "batch": "2026"}, timeout=20).status_code == 204
    assert db.scalar("SELECT COUNT(*) FROM subject_assignments WHERE cadet_id=%s AND subject_id=%s", (cadet_id, subject["id"])) == 1
    session = _json(requests.post(f"{settings.api_base_url}/attendance/sessions", headers=admin, json={"subjectId": subject["id"], "batch": "2026", "date": "2026-09-12", "startTime": "09:00", "endTime": "10:00", "sessionType": "class"}, timeout=20), 201)
    assert _json(requests.post(f"{settings.api_base_url}/attendance/records/bulk", headers=admin, json={"sessionId": session["id"], "records": [{"cadetId": cadet_id, "status": "present"}]}, timeout=20), 200)["message"] == "Attendance saved"
    record = db.one("SELECT id,status FROM attendance_session_records WHERE session_id=%s AND cadet_id=%s", (session["id"], cadet_id))
    assert record["status"] == "present"
    _json(requests.patch(f"{settings.api_base_url}/attendance/records/{record['id']}", headers=admin, json={"status": "absent"}, timeout=20), 200)
    assert db.one("SELECT status FROM attendance_session_records WHERE id=%s", (record["id"],)) == {"status": "absent"}

    assessment = _json(requests.post(f"{settings.api_base_url}/academics/assessments", headers=admin, json={"subjectId": subject["id"], "title": f"{data.run_id} Matrix Assessment", "assessmentType": "written", "date": "2026-09-12", "maxMarks": 100}, timeout=20), 201)
    mark = _json(requests.post(f"{settings.api_base_url}/academics/marks", headers=admin, json={"assessmentId": assessment["id"], "cadetId": cadet_id, "marks": 70, "remarks": "Initial"}, timeout=20), 200)
    _json(requests.patch(f"{settings.api_base_url}/academics/marks/{mark['id']}", headers=admin, json={"marks": 91, "remarks": "Corrected"}, timeout=20), 200)
    assert requests.patch(f"{settings.api_base_url}/academics/marks/{mark['id']}", headers=admin, json={"marks": 101}, timeout=20).status_code == 400
    stored_mark = db.one("SELECT marks,remarks FROM assessment_marks WHERE id=%s", (mark["id"],))
    assert stored_mark["remarks"] == "Corrected" and float(stored_mark["marks"]) == 91
    cadet_headers = _login(settings, cadet_email, data.password)
    assert float(_json(requests.get(f"{settings.api_base_url}/academics/marks/my", headers=cadet_headers, timeout=20), 200)[0]["marks"]) == 91
    attendance_history = _json(requests.get(f"{settings.api_base_url}/attendance/my", headers=cadet_headers, timeout=20), 200)
    assert attendance_history["history"][0]["status"] == "absent"
    report = _json(requests.get(f"{settings.api_base_url}/reports/cadet/{cadet_id}", headers=cadet_headers, timeout=20), 200)
    assert report["cadet"]["id"] == cadet_id and report["marks"]["total"] == 1

    # Password reset stores a one-time token, changes the password, and permits a fresh login.
    assert requests.post(f"{settings.api_base_url}/auth/forgot-password", json={"email": cadet_email}, timeout=20).status_code == 200
    reset = db.one("SELECT token,used FROM password_reset_tokens WHERE user_id=%s ORDER BY id DESC LIMIT 1", (cadet_id,))
    assert reset and reset["used"] is False
    assert requests.post(f"{settings.api_base_url}/auth/reset-password", json={"token": reset["token"], "newPassword": "ResetPass!9"}, timeout=20).status_code == 200
    assert db.one("SELECT used FROM password_reset_tokens WHERE token=%s", (reset["token"],)) == {"used": True}
    cadet_headers = _login(settings, cadet_email, "ResetPass!9")

    # Notes use local multipart storage; upload, download, and delete are all verified.
    note_title = f"{data.run_id} Matrix Note"
    note = _json(requests.post(f"{settings.api_base_url}/notes", headers=commander, data={"title": note_title, "description": "Dummy PDF"}, files={"file": ("matrix.pdf", b"%PDF-1.4\n% automated dummy\n", "application/pdf")}, timeout=20), 201)
    assert db.one("SELECT title,mime_type FROM notes WHERE id=%s", (note["id"],)) == {"title": note_title, "mime_type": "application/pdf"}
    download = requests.get(f"{settings.api_base_url}/notes/{note['id']}/download", headers=cadet_headers, timeout=20)
    assert download.status_code == 200 and download.content.startswith(b"%PDF")
    assert requests.delete(f"{settings.api_base_url}/notes/{note['id']}", headers=commander, timeout=20).status_code == 200
    assert db.scalar("SELECT COUNT(*) FROM notes WHERE id=%s", (note["id"],)) == 0

    # Notice update/delete and leave reject/delete are role-protected mutations.
    notice = _json(requests.post(f"{settings.api_base_url}/notices", headers=commander, json={"title": f"{data.run_id} Matrix Notice", "content": "Initial notice", "priority": "normal"}, timeout=20), 201)
    _json(requests.put(f"{settings.api_base_url}/notices/{notice['id']}", headers=commander, json={"title": notice["title"], "content": "Updated notice", "priority": "high"}, timeout=20), 200)
    assert db.one("SELECT content,priority FROM notices WHERE id=%s", (notice["id"],)) == {"content": "Updated notice", "priority": "high"}
    _json(requests.delete(f"{settings.api_base_url}/notices/{notice['id']}", headers=admin, timeout=20), 200)
    leave = _json(requests.post(f"{settings.api_base_url}/leaves", headers=cadet_headers, json={"start_date": "2026-10-10", "end_date": "2026-10-11", "reason": f"{data.run_id} Matrix leave"}, timeout=20), 201)
    _json(requests.patch(f"{settings.api_base_url}/leaves/{leave['id']}/review", headers=admin, json={"status": "rejected", "reviewer_remarks": "Test rejection"}, timeout=20), 200)
    assert db.one("SELECT status FROM leaves WHERE id=%s", (leave["id"],)) == {"status": "rejected"}
    _json(requests.delete(f"{settings.api_base_url}/leaves/{leave['id']}", headers=admin, timeout=20), 200)

    # Database-validated cleanup through the application's delete endpoints.
    _json(requests.delete(f"{settings.api_base_url}/cadets/{cadet_id}", headers=admin, timeout=20), 200)
    protected_delete = requests.delete(f"{settings.api_base_url}/subjects/{subject['id']}", headers=commander, timeout=20)
    assert protected_delete.status_code == 409 and "deactivate" in protected_delete.json()["message"]
    assert db.scalar("SELECT COUNT(*) FROM users WHERE id=%s", (cadet_id,)) == 0
    assert db.scalar("SELECT COUNT(*) FROM subjects WHERE id=%s", (subject["id"],)) == 1
