# Feature verification results

## Current verified architecture

- Primary application database: **Supabase PostgreSQL**.
- Test target: the isolated `e2e_test` schema in the Supabase `postgres` database. It is separate from the application's normal `public` schema.
- Video storage: the private Supabase Storage `physical-videos` bucket. Videos use time-limited signed upload and view URLs.
- The project does not use Neon, MongoDB, AWS S3, or local-disk video storage.

## Latest completed validation — 15 September 2026

`python -m pytest -q` completed against the isolated Supabase target: **14 passed, 0 failed** in 470.07 seconds. The suite creates tagged data and removes it during cleanup.

| Verification area | Evidence | Result |
| --- | --- | --- |
| Health and Supabase connectivity | `test_health.py` | PASS |
| Authentication, refresh/logout, protected routes and role restrictions | `test_authentication.py`, `test_role_authentication.py`, `test_security.py` | PASS |
| Commander administration and subject CRUD | `test_subjects.py`, `test_duplicate_submission.py` | PASS |
| Commander cadet-management UI and staff session-record API | `test_requirement_closure.py` | PASS |
| Commander → Admin → Cadet data flow | `test_cross_role.py`: cadet creation, subject assignment, marks, session attendance, notices, notifications, reports and cadet visibility | PASS |
| Attendance workflow | New session metadata, batch/type/date/time, roster marking, history and exact percentage display are exercised in the cross-role flow | PASS |
| Results, notes, leaves, settings, notices, reports, audit data and other service APIs | `test_results.py`, `test_notes_ui.py`, `test_service_matrix.py` | PASS |
| Physical video workflow | `backend/scripts/physical-flow-smoke-test.js`: private signed upload, server-side metadata/MP4-header validation, signed view, staff queue and review | PASS |
| Production frontend quality gates | `npm run lint`; `npm run build` | PASS (Vite emits only its existing bundle-size advisory) |
| Backend source validity | `node --check` over backend JavaScript (excluding dependencies) | PASS |

## Configuration still required at deployment

The application now detects missing SMTP configuration safely: in-app notifications still work and the server logs a clear startup warning. Actual email delivery requires deployment secrets for `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM`; those credentials are intentionally not stored in source control.

This report supersedes historical documents that referred to Neon, MongoDB, AWS S3, or a blocked physical-video workflow. The supplied developer briefs are retained as source requirements and are not treated as current architecture documentation.
