# DigiCampus automated end-to-end testing

This suite drives the real React UI with Selenium, waits for the real Express API, and then queries PostgreSQL to verify the rows created by the UI. It does not mock APIs or database responses.

## Safety first

The suite creates an administrator, cadets, an attendance session, an assessment, marks, audit entries, and a subject precondition. It therefore refuses to start unless all of the following are true:

- `TEST_DATABASE_URL` points to a dedicated database whose name contains `test`, `qa`, `sandbox`, or `e2e`, or uses an isolated schema with that name.
- `TEST_DATABASE_EXPECTED_NAME` exactly matches `SELECT current_database()`.
- `TEST_DATABASE_ISOLATED=true` and `TEST_ALLOW_DESTRUCTIVE=true` are explicitly set.
- The backend was started with that same dedicated database as its `DATABASE_URL`.

Never copy the production `DATABASE_URL` into `.env.test`. The guard is a safety net, not a substitute for a separate Supabase project/database or isolated Supabase schema.

## Setup

1. Use a dedicated Supabase project/database or an isolated `e2e_test` schema, run `backend/scripts/migrate.js` against it, and seed/create a commander account only in that isolated target. When using a schema, start the backend with `DB_SCHEMA=e2e_test`.
2. Copy `.env.example` to `.env.test`; put only test credentials in it. Set `TEST_ALLOW_DESTRUCTIVE=true` only after reviewing the database name.
3. Install the test dependencies with `python -m pip install pytest selenium "psycopg[binary]" python-dotenv`.
4. Start the backend with its `DATABASE_URL` set to the identical `TEST_DATABASE_URL`: `cd backend; npm start`.
5. Start the frontend with `VITE_API_BASE_URL` pointing to that backend: `cd frontend; npm run dev`.

`HEADLESS=false` is the default so browser activity is visible. Set `HEADLESS=true` for CI. If Selenium cannot discover Chrome, set `CHROME_BINARY` to the Chrome/Chromium executable.

## Run commands

Run the whole implemented suite and generate HTML/JUnit reports:

```powershell
python -m pytest --html=reports/e2e-report.html --self-contained-html --junitxml=test-results/e2e.xml
```

Useful focused runs:

```powershell
python -m pytest tests/test_authentication.py
python -m pytest tests/test_cross_role.py
python -m pytest tests/test_security.py
python -m pytest --lf
```

## What the executable workflow proves

1. API health and a direct PostgreSQL connection succeed.
2. A commander signs in, survives refresh, logs out, and invalid credentials return the actual backend error.
3. The commander uses the UI to provision an admin; the `users` row is checked.
4. That admin uses the UI to provision a cadet and assign the test subject; `users`, `cadet_profiles`, and `subject_assignments` are checked.
5. The admin creates an assessment and records a mark in the UI; `assessments` and `assessment_marks` are checked.
6. The admin creates a session and marks attendance in the UI; `attendance_sessions` and `attendance_session_records` are checked.
7. An admin posts an urgent notice; the notice and cadet notification rows are verified. The audit UI and report aggregate are checked against PostgreSQL.
8. The new cadet signs in, sees its own attendance and mark, reads the notification, changes the email preference, and submits a leave request.
9. The admin approves that leave request; the leave state and resulting cadet notification are checked in PostgreSQL and the cadet UI.
10. Cadets are denied another cadet's API record and the admin dashboard route; admins are denied the commander-only `/admins` route.

Every run generates one unpredictable `AUTO_TEST_<timestamp>_<uuid>` prefix. Session teardown deletes only rows containing that exact run prefix, including related audit records. A cleanup error fails teardown rather than being ignored.

Failure screenshots are in `screenshots/`; the optional HTML report is in `reports/`; JUnit output is in `test-results/`. Pytest’s summary is the authoritative passed/failed/skipped result. Do not describe planned tests as passed until this suite has executed against the isolated environment.

## Troubleshooting

- **All tests skipped:** complete `.env.test`; this is expected if any safety switch or test database proof is missing.
- **Health passes but UI workflow cannot see rows:** the frontend/backend is not connected to the same test database queried by `TEST_DATABASE_URL`.
- **Chrome cannot start:** install Chrome/Chromium or set `CHROME_BINARY`; Selenium Manager obtains the matching driver.
- **Cleanup fails:** preserve the report, inspect only the exact run prefix in the dedicated test DB, then resolve the constraint/schema mismatch before running again.
