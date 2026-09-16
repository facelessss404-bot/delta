# DigiCampus feature and service inventory

This inventory is derived from the mounted React routes, navigation/UI components, Express routes/controllers, and PostgreSQL migrations—not from README claims. `Student` below corresponds to the application's `cadet` role.

| ID | Role | Feature/Service | Frontend | Backend/API | Database | Status |
| --- | --- | --- | --- | --- | --- | --- |
| F001 | Public | Counselling registration | Yes | `POST /counselling-registrations` | `counselling_registrations` | IMPLEMENTED |
| F002 | Admin/Commander | Read counselling registrations | No route/UI | `GET /counselling-registrations` | `counselling_registrations` | PARTIALLY IMPLEMENTED |
| F003 | All roles | Login, token restore, logout | Yes | `/auth/login`, `/auth/me`, `/auth/logout` | `users` | IMPLEMENTED |
| F004 | Public/All roles | Password reset | Yes | `/auth/forgot-password`, `/auth/reset-password` | `password_reset_tokens`, `users` | PARTIALLY IMPLEMENTED (mail delivery optional) |
| F005 | Commander | Operational dashboard | Yes | `/dashboard/commander` | aggregate queries | IMPLEMENTED |
| F006 | Commander | Admin account create/read/delete | Yes | `/admins` | `users`, `audit_logs` | IMPLEMENTED |
| F007 | Admin/Commander | Cadet create/read/update/delete | Yes, via Cadet management | `/cadets` | `users`, `cadet_profiles`, `audit_logs` | IMPLEMENTED |
| F008 | Admin/Commander | Cadet subject assignment | Yes, in Cadet management create/edit form | `/cadets/:id/subjects` | `subject_assignments` | IMPLEMENTED |
| F009 | Cadet | Own cadet profile/subjects | Yes, dashboard and My profile route | `/cadets/:id`, `/cadets/:id/subjects` | users/profile/assignments | IMPLEMENTED |
| F010 | Admin/Commander | Subject catalogue CRUD | Yes | `/subjects` | `subjects` | IMPLEMENTED |
| F011 | Admin/Commander/Cadet | Legacy attendance records | No mounted UI | `/attendance` | `attendance` | PARTIALLY IMPLEMENTED |
| F012 | Admin/Commander/Cadet | Attendance sessions, eligibility, marking, history | Yes | `/attendance/sessions`, `/records/*`, `/my` | session/record tables, `audit_logs` | IMPLEMENTED |
| F013 | Admin/Commander/Cadet | Assessments and marks | Yes | `/academics/*` | assessments, marks, audit logs | IMPLEMENTED |
| F014 | Admin/Commander/Cadet | Exams and results | Yes | `/exams`, `/results` | exams, results | IMPLEMENTED |
| F015 | Admin/Commander/Cadet | Notices CRUD and urgent delivery | Yes | `/notices` | notices, notifications | IMPLEMENTED |
| F016 | Admin/Commander/Cadet | Training note upload/download/delete | Yes, multipart UI | `/notes` | `notes` metadata + private Supabase Storage | IMPLEMENTED |
| F017 | Cadet/Admin/Commander | Leave request/review/delete | Yes | `/leaves` | leaves, notifications | IMPLEMENTED |
| F018 | All roles | In-app notifications/read state | Yes | `/notifications` | notifications | IMPLEMENTED |
| F019 | All roles | Per-user settings | Yes | `/settings` | user_settings | IMPLEMENTED |
| F020 | Admin/Commander | Overview reports | Yes | `/reports/overview` | aggregate queries | IMPLEMENTED |
| F021 | Cadet/Admin/Commander | Individual cadet report API | Staff report selector; Cadet own API access | `/reports/cadet/:cadetId` | aggregate queries | IMPLEMENTED |
| F022 | Admin/Commander | Audit-log viewer | Yes | `/audit-logs` | audit_logs | IMPLEMENTED |
| F023 | Cadet/Admin/Commander | Physical-video submission/review | Cadet upload UI with percentage progress; staff review UI | `/physical/*` | `physical_submissions` + private Supabase Storage | IMPLEMENTED (requires configured buckets and service-role key) |
| F024 | All roles | Localized navigation | Yes | client i18n only | N/A | IMPLEMENTED |

Compatibility-only files `academicsRoutes.js` and `physicalRoutes.js` are not mounted as separate services. They are excluded to avoid double-counting.
