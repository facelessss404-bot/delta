# Delta Squad Foundation

Role-based cadet training portal built with React, Express, Supabase PostgreSQL and Supabase Storage.

## Modules

- JWT authentication and server-side RBAC: Training Commander (`commander`), admin and cadet.
- Cadet and subject management.
- Subject/session attendance with bulk marking, dynamic cadet summaries and audit records.
- Assessments, results, notices, notes, leave management, reports and audit logs.
- Account settings, in-app notifications and English/Hindi/Tamil navigation.
- Public counselling registration.

Training notes and physical-training videos are stored in private Supabase Storage buckets. SMTP delivery remains optional and requires separate infrastructure.

## Setup

1. Copy `backend/.env.example` to `backend/.env` and set the Supabase `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` and `FRONTEND_ORIGIN`.
2. Install dependencies in `backend` and `frontend`.
3. Run `npm run migrate` in `backend`.
4. Optionally run `npm run seed` for additive development accounts and subjects.
5. Run `npm run dev` in both folders.

## Verification

```powershell
cd backend
npm run migrate
npm run test:auth

cd ..\frontend
npm run lint
npm run build
```

Never commit `.env` files or production credentials. Before deployment, set the real frontend origin, use a strong JWT secret, replace development passwords and configure SMTP only if email delivery is required. The Supabase service-role key belongs only in the backend environment; never put it in Netlify or frontend code.
