# Delta Squad Foundation — Client Handover & Operations Guide

> **Live Deployment URL:** [https://deltasquads.netlify.app/](https://deltasquads.netlify.app/)  
> **Backend Service:** Render Express API (Proxy via Netlify `/api/*`)  
> **Database & Storage:** Supabase PostgreSQL & Supabase Private Storage  
> **Prepared For:** Final Client Handover & Demonstration

---

## 1. The 3 System Logins (Credentials Cheat-Sheet)

All demo accounts are pre-loaded in the live database with password **`password123`**.

| Role | Email Login | Password | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Training Commander** *(Super Admin)* | `commander@commander.com` | `password123` | Top-level command operations, creating & managing Admin accounts, reviewing physical drills, approving cadet leaves, full audit logs, operational reports. |
| **Admin Officer** *(Operations / Instructor)* | `admin@admin.com` | `password123` | Creating cadets, assigning subject batches, conducting attendance sessions, recording assessment marks, reviewing leaves, posting notices, uploading training notes. *(Cannot manage Admin accounts)* |
| **Cadet** *(Student Aspirant)* | `cadet@cadet.com` | `password123` | Student portal for Cadet Rohan Sharma. Views individual attendance %, academic marks, exam results, approved leaves, downloaded notes, and uploads physical training video evidence. |

> **Tip for Tomorrow's Demo:** On the Login page ([https://deltasquads.netlify.app/#login](https://deltasquads.netlify.app/#login)), 1-click quick demo buttons (**🛡️ Commander**, **📋 Admin**, **🎖️ Cadet**) are provided right on the card for instant credential entry.

---

## 2. How to Change Commander Login Credentials

You can change the Commander's email, password, or name in **two easy ways**:

### Method A — Using the Ready-to-Run CLI Script (Fastest)
Run the helper script from your terminal:
```powershell
# Format: node backend/scripts/change-commander-credentials.js "<email>" "<password>" "<name>"
node backend/scripts/change-commander-credentials.js "newcommander@delta.com" "SecurePass2026!" "Lt. Esan"
```
This updates the database record with a new bcrypt-hashed password immediately.

### Method B — In the Project Code / Seed Files
If you ever re-run seeds, edit lines 14–22 in:
- [`backend/scripts/seed-mock-data.js`](file:///d:/Ideaseternal_Projects/delta_client_1/backend/scripts/seed-mock-data.js#L14-L22)
- [`backend/seed.js`](file:///d:/Ideaseternal_Projects/delta_client_1/backend/seed.js#L7-L12)

### Method C — In the Web Application
Log in as the Commander, navigate to **Settings** (`/settings`), or use **Forgot Password** (`/forgot-password`) on the public landing page.

---

## 3. End-to-End Workflow & Demo Script for Client Handover

Follow this step-by-step walkthrough to give the client an impressive, structured demonstration:

```
┌─────────────────────────────────────────────────────────────┐
│                   PUBLIC LANDING PAGE                       │
│  - Video Header, About DSF, Posters, Counselling Form       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                Sign in (Commander / Admin / Cadet)
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ COMMANDER PORTAL │  │   ADMIN PORTAL   │  │   CADET PORTAL   │
│ - Admin Accounts │  │ - Cadet Roster   │  │ - My Attendance  │
│ - Command Stats  │  │ - Attendance Run │  │ - My Academics   │
│ - Drill Approvals│  │ - Academic Marks │  │ - Physical Video │
│ - Full Audit Log │  │ - Notice Board   │  │ - Leave Request  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Step 1: Public Landing Page & Counselling Inquiries
- **URL:** [https://deltasquads.netlify.app/](https://deltasquads.netlify.app/)
- **What to show:**
  1. High-impact video background hero with motto *"Train Hard. Lead Stronger"*.
  2. Foundation photo gallery with Lt. Esan's activities and 100% Scholarship posters.
  3. **Counselling Registration Section:** Point out the program selection (JLP, SLP, YLP, SSLP) and live lead-capture form.

---

### Step 2: Training Commander Login (`commander@commander.com`)
- **URL:** [https://deltasquads.netlify.app/commander](https://deltasquads.netlify.app/commander)
- **What to show:**
  1. **Command Dashboard:** Live metrics tiles (Total Cadets: 6, Active Admins: 1, Overall Attendance: 84.6%, Pending Reviews: 2).
  2. **Alerts & Exceptions Banner:** Automatically highlights actionable items:
     - *"2 physical submissions await review."*
     - *"Cadet Vikram Rathore has 60.0% attendance."* (Demonstrates proactive low-attendance warnings).
  3. **Admin Accounts Management (`/admins`):** Show that **only Commander** has access to add or remove operational Admin accounts.
  4. **Operational Reports (`/reports`):** Overall academy health and individual cadet drilldowns.
  5. **Audit Logs (`/audit-logs`):** Full traceability showing actor, action, timestamp, and entity affected.

---

### Step 3: Admin Officer Login (`admin@admin.com`)
- **URL:** [https://deltasquads.netlify.app/admin](https://deltasquads.netlify.app/admin)
- **What to show:**
  1. **Cadet Management:** Roster of cadets with roll numbers (e.g., `DSF-2025-001`), batches (`Alpha Batch 2025-26`), and subject assignment checklist.
  2. **Attendance Actions (`/attendance`):**
     - Select subject (e.g. *Physics* or *Mathematics*).
     - Show **Previous Sessions** sidebar. Click *"Edit"* to demonstrate historical correction with single-audit logging.
     - Show *"Mark all present"* / *"Mark all absent"* buttons for rapid daily parade muster.
  3. **Academics & Assessments (`/academics`):**
     - Create assessment (written, GTO, psych, physical test) with maximum marks.
     - Enter or update cadet scores.
  4. **Physical Training Verification (`/physical`):**
     - Review queue showing Cadet submissions.
     - Click **"View securely"** — backend generates a short-lived signed URL from Supabase Storage and streams the actual video.
     - Enter remarks (e.g., *"Strict form maintained"*) and click **Accept** or **Reject**.
  5. **Leave Requests (`/leaves`):**
     - View pending cadet leaves (e.g., Medical consultation at Military Hospital).
     - Approve or reject with remarks.
  6. **Notice Board & Notes (`/notices` & `/notes`):**
     - Urgent/High priority announcements.
     - Downloadable course compendiums and formulas.

---

### Step 4: Cadet Portal Login (`cadet@cadet.com`)
- **URL:** [https://deltasquads.netlify.app/cadet](https://deltasquads.netlify.app/cadet)
- **What to show:**
  1. **Personal Dashboard:** Overall attendance ring (90%), sessions attended (9/10), academic average (88%), and physical drills accepted.
  2. **Subject Attendance Cards:** Visual percentage rings for Physics, Math, SSB, and General Studies.
  3. **Physical Training Evidence Upload (`/physical`):**
     - Show Cadet's history of accepted and pending drill videos.
     - Demonstrate video upload progress bar (supports MP4, WebM up to 50 MB).
  4. **Results & Transcripts (`/results`):** Official results matrix for Term 1 Written, Mock SSB Board, GTO tasks, and Psychological Dossier.
  5. **Leave Applications (`/leaves`):** Cadet applies for leave with start date, end date, and reason, tracking approval status in real-time.

---

## 4. Key Security & Architecture Highlights for Client Confidence

When presenting to the client, mention these high-value engineering points:
1. **Server-Side Role-Based Access Control (RBAC):** Cadet ownership is strictly enforced in PostgreSQL queries; Cadets cannot access another cadet's records even if manipulated in browser tools.
2. **Private Supabase Storage:** Physical drill videos and training notes are never public URLs. The API issues short-lived 5-minute signed URLs.
3. **Audit Trail:** Every attendance correction, assessment mark update, and leave decision logs the user ID, timestamp, and previous vs. new data in `audit_logs`.
4. **Relational PostgreSQL Integrity:** Foreign keys ensure that deleting a test record automatically cleans up orphan records safely.

---

## 5. Quick Reference: File Map in Codebase

| Purpose | File Path |
| :--- | :--- |
| **All Mock Data Seeding** | [`backend/scripts/seed-mock-data.js`](file:///d:/Ideaseternal_Projects/delta_client_1/backend/scripts/seed-mock-data.js) |
| **Change Commander Credentials** | [`backend/scripts/change-commander-credentials.js`](file:///d:/Ideaseternal_Projects/delta_client_1/backend/scripts/change-commander-credentials.js) |
| **Live Netlify E2E Validation** | [`backend/scripts/e2e-netlify-test.js`](file:///d:/Ideaseternal_Projects/delta_client_1/backend/scripts/e2e-netlify-test.js) |
| **Commander & Admin Summaries** | [`frontend/src/components/StaffDashboardSummary.jsx`](file:///d:/Ideaseternal_Projects/delta_client_1/frontend/src/components/StaffDashboardSummary.jsx) |
| **Attendance Session Panel** | [`frontend/src/components/AttendancePanel.jsx`](file:///d:/Ideaseternal_Projects/delta_client_1/frontend/src/components/AttendancePanel.jsx) |
| **Physical Training & Video** | [`frontend/src/pages/PhysicalTraining.jsx`](file:///d:/Ideaseternal_Projects/delta_client_1/frontend/src/pages/PhysicalTraining.jsx) |
| **Login & Demo Access** | [`frontend/src/pages/Login.jsx`](file:///d:/Ideaseternal_Projects/delta_client_1/frontend/src/pages/Login.jsx) |
