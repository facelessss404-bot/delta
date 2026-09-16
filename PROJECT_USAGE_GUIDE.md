# Delta Squad Foundation - Operations Guide

## Current architecture

- Frontend: React, Vite, React Router, Axios, Tailwind CSS, Framer Motion, and Lucide.
- API: Express with JWT authentication, bcryptjs password hashing, server-side RBAC, and PostgreSQL `pg` queries.
- Data: **Supabase PostgreSQL** via `DATABASE_URL`; it does not use MongoDB, Mongoose, Neon, Firebase, or an ORM.
- Files: private **Supabase Storage** buckets. `training-notes` holds training materials and `physical-videos` holds cadet video evidence. The backend issues signed upload and short-lived signed viewing URLs.

The application uses the roles `commander`, `admin`, and `cadet`. All data access goes through the Express API; the frontend never connects directly to Supabase tables or uses the Supabase service-role key.

## Start locally

```powershell
cd backend
Copy-Item .env.example .env
# Set DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET and FRONTEND_ORIGIN.
npm run migrate
npm run seed
npm run dev
```

In another terminal:

```powershell
cd frontend
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173`. Check the API with `http://127.0.0.1:5000/api/health`.

## Role access

| Role | Main responsibilities |
| --- | --- |
| Training Commander | Full command dashboard; manages Admin accounts, Cadets, subjects, attendance, academics, physical reviews, reports and audit logs. |
| Admin | Manages Cadets and their subject assignments; operates attendance, academics, physical reviews, notices, notes, leaves, reports and audit logs. Cannot manage Admin accounts. |
| Cadet | Sees only their own attendance, academics, results, profile, notifications and leave history; can submit and view their own physical-training evidence. |

Cadet record ownership is enforced by the backend, not just hidden in the frontend.

## Operational workflows

### Cadet management

Admin and Commander use **Cadet management** to create, edit, remove Cadets, and set their exact subject assignments. The Commander reaches it from the Commander sidebar; Admin uses the Admin dashboard.

### Attendance

Staff create a session with subject, optional batch/class, date, session type, and optional start/end time. The roster contains only active Cadets assigned to that subject and batch. Staff can mark all present/absent, correct individual entries, reopen prior sessions, and save only changed corrections. Every create/correction is audited. Cadets see per-subject percentage rings, present/absent counts, and subject/batch/session-type filters over their own history.

### Academics and results

Staff create configurable assessments with a subject, assessment type, date, and maximum marks. Marks are validated against the maximum, retain audit entries, and Cadets can read only their own history. The separate Results module supports exams such as GTO, psych, interview, written, and mock SSB.

### Physical training

Cadets select an activity/date and upload a 50 MB-or-smaller MP4, WebM, OGG, or QuickTime video. The UI reports actual upload progress. Before a submission is recorded, the API verifies its owner-scoped storage key, stored size, stored MIME type, and an expected video-file signature. Staff can securely view, accept/reject, and comment on submissions. A malware-scanning service is not included; add one for a regulated production deployment.

### Notifications and email

Urgent notices and leave reviews create in-app notifications. SMTP email is optional and non-blocking: configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` to enable delivery. Without them, development logs the message and production logs that email is disabled.

## Testing

```powershell
cd frontend
npm run lint
npm run build

cd ..\backend
npm run test:auth
```

For the full browser/API/database suite, use an isolated Supabase database or a dedicated `e2e_test` schema. Set the `TEST_*` values documented in `.env.example`, including `TEST_DATABASE_ISOLATED=true` and `TEST_ALLOW_DESTRUCTIVE=true`; the suite creates and removes only tagged test data. Do not point it at production.
