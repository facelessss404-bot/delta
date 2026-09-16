# DigiCampus automated coverage

Browser tests run only when the isolated-environment guard has all `TEST_*` values configured. Each run generates a unique `AUTO_TEST_*` identifier and removes only rows bearing that identifier.

| Area | Automated flow | Data verification |
| --- | --- | --- |
| Commander | Login, invalid login, refresh, logout | Session persistence and token removal |
| Admin | Dedicated invalid login, refresh, logout | Session persistence and token removal |
| Cadet | Dedicated invalid login, refresh, logout | Session persistence and token removal |
| Subjects | Commander creates, edits, rejects a duplicate, and deletes a subject | `subjects` row values and final deletion |
| Results | Commander creates an exam, creates and edits a score; cadet reads it; admin deletes it | `exams` and `results` row values through every state |
| Cadet lifecycle | Commander creates admin; admin creates cadets; cadet reads own data | `users`, `cadet_profiles`, `subject_assignments` |
| Academics and attendance | Admin creates assessment/mark and attendance session/record | `assessment_marks`, `attendance_sessions`, `attendance_session_records` |
| Engagement | Notice, notification, settings, leave request and approval | `notices`, `notifications`, `user_settings`, `leaves` |
| Access control | Anonymous, cadet, and admin route/API restrictions | HTTP status and route redirect behavior |
| Timing | Health endpoint checks the global `Server-Timing: app;dur=…` contract | API response header |

Video submission and note upload remain conditional integrations. They require an isolated object-storage bucket (and, for notes, an upload fixture) before an end-to-end upload can run safely. The physical-video endpoint currently reports that storage is not enabled when its required configuration is absent, so an upload test would only test that expected failure rather than a real upload.

Run the full suite after creating a non-production `.env.test` from `.env.example`:

```powershell
$env:HEADLESS = 'true'
python -m pytest -q --junitxml=test-results/e2e.xml --html=reports/e2e.html --self-contained-html
```
