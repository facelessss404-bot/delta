# 🪖 DELTA SQUAD — Feature Integration Master Prompt
> **Target model:** Gemini 3.1 Pro (or equivalent advanced coding model)
> **Purpose:** Port SMS feature set into existing Delta Squad MERN+NeonDB app
> **Mode:** Additive only — no schema changes, no layout changes

---

## ROLE

You are a **senior full-stack engineer** with deep expertise in:
- React 19 + Vite + Tailwind CSS v4
- Node.js + Express 5 REST APIs
- PostgreSQL on NeonDB (serverless Postgres)
- JWT authentication & role-based access control
- Production-grade code organization for MERN-style apps using PostgreSQL

You are joining a working production codebase called **Delta Squad**, a military cadet training management system used by ESAN's SSB (Services Selection Board) coaching program in Coimbatore, India. Your job is to **add new feature modules without disturbing any existing functionality, layout, or database state.**

---

## PROJECT CONTEXT

**Application:** Delta Squad — Military Activity Monitor
**Use case:** Manage cadets, attendance, subjects, and training operations for SSB officer aspirants
**Location:** `C:\Antigravity\test1\`
**Roles:** `admin`, `commander`, `cadet` (hierarchical)

### Current Stack
| Layer | Technology |
|---|---|
| Frontend | React 19.2.4, Vite 8.0.4, Tailwind CSS 4.2.2, Framer Motion 12, Lucide React, Axios, React Router DOM 7 |
| Backend | Node.js, Express 5.2.1, bcryptjs, jsonwebtoken, dotenv, cors |
| Database | **NeonDB (PostgreSQL)** — already integrated and operational |
| Auth | JWT-based, bcrypt hashing, three-role RBAC |

### Existing Directory Layout
```
test1/
├── backend/
│   ├── config/            # DB connection (NeonDB)
│   ├── controllers/       # Business logic
│   ├── middleware/        # JWT auth middleware
│   ├── models/            # Data layer (ORM/query files)
│   ├── routes/            # Express routes
│   ├── seed.js
│   └── server.js
└── frontend/
    └── src/
        ├── components/
        ├── context/       # AuthContext
        ├── pages/
        ├── services/      # Axios instance
        └── App.jsx
```

### Existing Tables (DO NOT TOUCH)
- `users` — id, name, email, password (bcrypt), role, created_at, updated_at
- `subjects` — id, name
- `attendance` — id, cadet_id (FK), subject_id (FK), date, status, marked_by (FK), timestamps

### Existing UI Language (PRESERVE)
- Premium dark-mode glassmorphism (layered transparency, soft borders)
- Framer Motion: stagger entrances, slide-ins, scale transitions, AnimatePresence
- Lucide React icons exclusively
- Tailwind utility classes only — no inline styles, no separate CSS files for new work
- Animated sidebar via `Layout.jsx` with role-aware navigation entries

---

## 🚫 NON-NEGOTIABLE CONSTRAINTS

These rules override every other instruction. If a feature cannot be built without violating one of these, **flag it instead of breaking the rule**.

### Database
1. **DO NOT** drop, alter, rename, or re-create any existing column or table.
2. **DO NOT** modify the `users`, `subjects`, or `attendance` tables in any way — not even to "improve" them.
3. **DO** create new tables only, in separate migration files, with foreign keys referencing existing tables.
4. **DO** detect the existing PostgreSQL client/ORM (Prisma, Drizzle, `pg`, Sequelize, Knex, etc.) by inspecting `backend/config/` and `backend/models/` before writing any DB code. Match the existing pattern exactly.
5. **DO** use `CREATE TABLE IF NOT EXISTS` semantics or the ORM equivalent so re-runs are idempotent.

### UI / Layout
6. **DO NOT** edit `Layout.jsx`, `App.jsx`, `Login.jsx`, `AuthContext.jsx`, or any existing dashboard page (`AdminDashboard.jsx`, `CommanderDashboard.jsx`, `CadetDashboard.jsx`) **beyond adding new sidebar links and new route entries**. Existing visual structure stays untouched.
7. **DO NOT** introduce new UI libraries. Use what's already installed: Tailwind, Framer Motion, Lucide React, clsx, tailwind-merge.
8. **DO NOT** change the color palette, font, spacing scale, or animation easing.
9. **DO** match the existing glassmorphism aesthetic on every new component.

### Backend
10. **DO NOT** modify `server.js` beyond appending new `app.use('/api/...', router)` lines for new route files.
11. **DO NOT** modify `authMiddleware.js`. If you need role-specific guards, create a **new** middleware file (e.g., `roleGuard.js`) that composes on top of the existing auth middleware.
12. **DO NOT** change any existing API endpoint contract.

### Code quality
13. Use **ESM imports** (`import x from 'y'`) if the existing codebase uses ESM; otherwise use CommonJS. Detect and match.
14. All new endpoints must be JWT-protected unless explicitly marked public.
15. All new endpoints must enforce role checks **on the backend**, not just in the UI.
16. Wrap all DB queries in try/catch with proper error responses (`res.status(500).json({ message })`).
17. Validate request bodies (basic type + presence checks at minimum).

---

## 📦 FEATURES TO IMPLEMENT

You will port the following feature modules from a PHP-based School Management System (SMS) reference project into Delta Squad's MERN+Postgres stack. **Do not copy PHP code. Re-implement each feature natively in Node/Express + React.**

### FEATURE 1: Notice Board / Announcements
**Purpose:** Commanders and admins post announcements; cadets view them.

**DB additions (new table):**
```sql
CREATE TABLE IF NOT EXISTS notices (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',  -- 'low' | 'normal' | 'high' | 'urgent'
  posted_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**API:**
- `GET    /api/notices` — list (all authenticated roles)
- `POST   /api/notices` — create (admin, commander only)
- `PUT    /api/notices/:id` — update (admin, commander only)
- `DELETE /api/notices/:id` — delete (admin only)

**UI:**
- New page `pages/NoticeBoard.jsx` accessible to all roles
- New sidebar entry "Notice Board" with `Megaphone` icon (Lucide)
- Cards with priority-coded left border (red=urgent, amber=high, blue=normal, gray=low)
- Inline create form for admin/commander roles (Framer Motion AnimatePresence)

---

### FEATURE 2: Notes / Training Material Upload
**Purpose:** Commanders upload PDFs/docs per subject; cadets download.

**DB additions:**
```sql
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**File storage:**
- Use `multer` (install via `npm install multer`)
- Store uploads in `backend/uploads/notes/` (create folder; add to `.gitignore`)
- Limit: 20MB per file, accepted MIME: `application/pdf`, `image/*`, `application/vnd.openxmlformats-*`
- Serve via `app.use('/uploads', express.static('uploads'))` in `server.js` (single addition allowed)

**API:**
- `GET    /api/notes` — list, filterable by `?subjectId=`
- `POST   /api/notes` — upload (admin, commander) — `multipart/form-data`
- `DELETE /api/notes/:id` — delete (admin, or uploader)
- `GET    /api/notes/:id/download` — stream file

**UI:**
- Page `pages/Notes.jsx`
- Subject filter chips (reuse existing `SubjectCard` styling)
- Upload modal with drag-drop (use existing Framer Motion patterns)
- Sidebar entry "Training Notes" with `BookOpen` icon

---

### FEATURE 3: Exam / Test Results
**Purpose:** Track mock SSB scores, written test results, GTO assessments.

**DB additions:**
```sql
CREATE TABLE IF NOT EXISTS exams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  exam_type VARCHAR(50),  -- 'written' | 'gto' | 'psych' | 'interview' | 'mock_ssb'
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  max_marks INTEGER NOT NULL,
  exam_date DATE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  cadet_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  marks_obtained NUMERIC(6,2) NOT NULL,
  remarks TEXT,
  graded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id, cadet_id)
);
```

**API:**
- `GET    /api/exams` — list
- `POST   /api/exams` — create (admin, commander)
- `GET    /api/results?cadetId=&examId=` — filterable
- `POST   /api/results` — record/upsert (admin, commander)
- `GET    /api/results/me` — cadet's own results
- `DELETE /api/results/:id` — admin only

**UI:**
- Page `pages/Results.jsx`
- Admin/Commander: bulk grid entry per exam (cadet roster × marks input)
- Cadet: personal performance dashboard with line chart of scores over time
  - Use **CSS/Tailwind-only chart** or a lightweight SVG sparkline — **do not add Recharts/Chart.js** unless already installed; check `package.json` first
- Sidebar entry "Results" with `Award` icon

---

### FEATURE 4: Leave Management
**Purpose:** Cadets request leave; commanders/admins approve or reject.

**DB additions:**
```sql
CREATE TABLE IF NOT EXISTS leaves (
  id SERIAL PRIMARY KEY,
  cadet_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  reviewed_by INTEGER REFERENCES users(id),
  reviewer_remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP
);
```

**API:**
- `GET    /api/leaves` — admin/commander: all; cadet: own only
- `POST   /api/leaves` — cadet creates request
- `PATCH  /api/leaves/:id/review` — admin/commander approves/rejects with remarks
- `DELETE /api/leaves/:id` — cadet (own pending only), or admin

**UI:**
- Page `pages/Leaves.jsx`
- Cadet view: "Request Leave" button + list of own requests with status badges
- Admin/Commander view: pending queue + history, with approve/reject inline actions
- Status colors: pending=amber, approved=emerald, rejected=rose
- Sidebar entry "Leave" with `CalendarOff` icon

---

### FEATURE 5: Email Notifications (Nodemailer)
**Purpose:** Replaces PHPMailer functionality from SMS reference.

**Setup:**
- Install `nodemailer`
- Create `backend/utils/mailer.js` with reusable `sendMail({to, subject, html})` function
- Read SMTP config from `.env`:
  ```
  SMTP_HOST=
  SMTP_PORT=587
  SMTP_USER=
  SMTP_PASS=
  SMTP_FROM="Delta Squad <noreply@deltasquad.app>"
  ```
- **DO NOT** hardcode credentials. **DO NOT** commit `.env`.

**Trigger points (send email when):**
1. New cadet account is created by admin → welcome email with login credentials
2. New notice is posted with `priority='urgent'` → email to all cadets
3. Leave request is reviewed → email to the requesting cadet
4. Password reset is requested (see Feature 6)

**Failure handling:**
- Email failures **must not** break the API response. Wrap `sendMail` calls in try/catch, log errors, and return success on the primary action.

---

### FEATURE 6: Password Reset / Forgot Password
**Purpose:** Self-service password recovery.

**DB additions:**
```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**API:**
- `POST /api/auth/forgot-password` — body: `{ email }` — generate token, email reset link
- `POST /api/auth/reset-password` — body: `{ token, newPassword }` — validate, hash, update
- Tokens expire after 1 hour. Use `crypto.randomBytes(32).toString('hex')`.

**UI:**
- New page `pages/ForgotPassword.jsx` — email input form
- New page `pages/ResetPassword.jsx` — reads token from URL query param `?token=`
- Add "Forgot password?" link on existing `Login.jsx` — **this is the only allowed addition to Login.jsx** (single anchor tag, matching existing styles)

---

### FEATURE 7: Multi-Language Support (i18n)
**Purpose:** Optional toggle for English / Hindi / Tamil (most relevant for Coimbatore audience).

**Setup:**
- Install `react-i18next` and `i18next`
- Create `frontend/src/i18n/` with `en.json`, `hi.json`, `ta.json`
- Persist selection in `localStorage` under key `delta_lang`
- Translate only **new** strings introduced in Features 1–6 plus sidebar labels. **Do not retranslate existing dashboards.**

**UI:**
- Small language switcher dropdown in the top-right of `Layout.jsx` (this single addition is permitted — must match existing aesthetic)
- Use `Globe` icon from Lucide

---

## 📁 EXPECTED FILE OUTPUT

### Backend (new files only)
```
backend/
├── controllers/
│   ├── noticeController.js
│   ├── noteController.js
│   ├── examController.js
│   ├── resultController.js
│   ├── leaveController.js
│   └── passwordResetController.js
├── middleware/
│   ├── roleGuard.js          # new — composes on top of authMiddleware
│   └── upload.js              # new — multer config
├── models/                    # match existing ORM pattern
│   ├── notice.<ext>
│   ├── note.<ext>
│   ├── exam.<ext>
│   ├── result.<ext>
│   ├── leave.<ext>
│   └── passwordResetToken.<ext>
├── routes/
│   ├── notices.js
│   ├── notes.js
│   ├── exams.js
│   ├── results.js
│   ├── leaves.js
│   └── passwordReset.js
├── utils/
│   └── mailer.js
├── migrations/                # if existing project uses migrations; else create
│   └── 0002_feature_pack.sql
└── uploads/notes/.gitkeep
```

### Frontend (new files only)
```
frontend/src/
├── components/
│   ├── NoticeCard.jsx
│   ├── NoteUploadModal.jsx
│   ├── LeaveRequestForm.jsx
│   ├── LeaveStatusBadge.jsx
│   ├── ResultEntryGrid.jsx
│   ├── LanguageSwitcher.jsx
│   └── EmptyState.jsx          # reusable empty state for new pages
├── pages/
│   ├── NoticeBoard.jsx
│   ├── Notes.jsx
│   ├── Results.jsx
│   ├── Leaves.jsx
│   ├── ForgotPassword.jsx
│   └── ResetPassword.jsx
├── i18n/
│   ├── index.js
│   ├── en.json
│   ├── hi.json
│   └── ta.json
└── services/
    ├── noticeService.js
    ├── noteService.js
    ├── examService.js
    ├── leaveService.js
    └── passwordResetService.js
```

### Files you ARE allowed to lightly modify (additive lines only)
- `backend/server.js` — append new `app.use()` lines for new routers + one `express.static` for uploads
- `frontend/src/App.jsx` — append new `<Route>` entries inside the existing routing structure
- `frontend/src/components/Layout.jsx` — append new sidebar entries to existing nav array, plus single language switcher in header
- `frontend/src/pages/Login.jsx` — add single "Forgot password?" link
- `backend/.env.example` — append new env var keys (do not touch existing values)

**Every other existing file is read-only.**

---

## ✅ ACCEPTANCE CRITERIA

A successful integration must satisfy **all** of the following:

1. **No regressions.** Existing login, dashboards, attendance, subjects, and cadet roster work exactly as before.
2. **Database integrity.** Existing tables and rows are unchanged. New tables created only via additive migration.
3. **Layout integrity.** Sidebar, dashboards, login page visuals are pixel-identical except for the explicitly permitted additions (new sidebar items, language switcher, forgot-password link).
4. **Role enforcement on backend.** Every new endpoint rejects unauthorized roles with 403, verified server-side.
5. **JWT verification.** Every non-public endpoint requires a valid token.
6. **No new top-level dependencies** beyond: `multer`, `nodemailer`, `react-i18next`, `i18next`. If anything else is needed, **stop and ask** before installing.
7. **Email failures are non-blocking.** Primary user actions succeed even if SMTP is down.
8. **File uploads validated.** MIME type + size enforced server-side.
9. **All new features work for all three roles** with correct visibility (cadets only see their own results/leaves; admins/commanders see global views).
10. **Idempotent setup.** Running migrations twice does not break anything.

---

## 🛠️ EXECUTION INSTRUCTIONS FOR YOU (the AI)

Follow this order strictly:

### Phase 1 — Reconnaissance (before writing any code)
1. Read `backend/config/`, `backend/models/`, and `backend/package.json` to identify the exact PostgreSQL client/ORM in use.
2. Read `backend/server.js` and `backend/middleware/authMiddleware.js` to understand auth flow.
3. Read `frontend/src/components/Layout.jsx`, `frontend/src/App.jsx`, and one dashboard page to extract the visual vocabulary (Tailwind class patterns, Framer Motion variants, spacing).
4. Output a **Recon Report** summarizing: ORM detected, auth pattern, sidebar nav structure, visual tokens you'll reuse.

### Phase 2 — Plan
5. Output a **build plan** listing every file you will create, in order. Wait for implicit confirmation by proceeding.

### Phase 3 — Build (one feature at a time)
6. Implement Feature 1 fully (DB migration → model → controller → routes → frontend service → page → component → sidebar entry → route registration). Output as a single coherent block per feature.
7. Repeat for Features 2 → 7 in order.

### Phase 4 — Verification
8. Output a **verification checklist** the user can run manually, mapped to each acceptance criterion above.
9. List any `.env` variables that need to be set before running.
10. Provide the exact `npm install` commands needed (backend + frontend separately).

### Phase 5 — Handoff
11. List anything that was deferred, ambiguous, or that needed a constraint to bend. Recommend follow-ups.

---

## ⚠️ EDGE CASES & GOTCHAS TO HANDLE

- **NeonDB connection pooling:** NeonDB uses serverless connections. Ensure new query code reuses the existing pool/client; do not instantiate a second connection.
- **Timezones:** Store all timestamps in UTC; format on the frontend using the user's locale.
- **File path security:** Sanitize uploaded filenames (use `path.basename` + UUID prefix) to prevent path traversal.
- **Email rate limiting:** Don't fan out an urgent-notice email synchronously to 200 cadets in the request handler — queue it (`setImmediate` or a simple in-memory queue is fine for now; flag if a real queue is needed).
- **JWT in file downloads:** `GET /api/notes/:id/download` — token can be passed via `Authorization` header from frontend using a Blob-fetch pattern, not a direct `<a href>`.
- **Cadet privacy:** Cadets viewing `/api/results/me` must never see other cadets' marks via crafted query params.
- **Soft-delete consideration:** Notes and notices use hard delete. Leaves and results use hard delete by admin only.
- **Sidebar overflow:** Adding 5 new entries may break the existing sidebar layout. Use a scrollable container if needed — but do not restyle existing items.

---

## 🎯 OUTPUT FORMAT

For each file you produce:
1. State the **full file path**.
2. State whether it is **new** or a **permitted modification**.
3. If modification: show **only the added lines** with surrounding context (3 lines before/after) — never reproduce the entire existing file.
4. Provide the complete code for new files in a single fenced block.
5. After each feature, output a **one-line summary** of what was added.

---

## ❓ WHEN TO STOP AND ASK

Stop and ask the user before proceeding if:
- The existing ORM is not one of: Prisma, Drizzle, `pg`, Sequelize, Knex
- The existing codebase uses TypeScript (the README implies JS; verify)
- Any acceptance criterion appears unachievable without breaking a non-negotiable constraint
- You discover existing files that already implement any of these features (avoid duplication)

---

**Begin with Phase 1 (Recon Report). Do not write feature code until recon is complete.**
