# Delta Squad Frontend

This folder contains the website used by admins, commanders, cadets, and counselling applicants.

## What users see

- The public landing page and counselling registration form.
- A login page for staff and cadets.
- An admin dashboard for managing cadets and attendance.
- A commander dashboard for checking subjects and recording attendance.
- A cadet dashboard for viewing personal attendance progress.

The website sends user actions to the backend, which saves the information in Supabase PostgreSQL and Supabase Storage.

## Run the website

```powershell
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`.

The backend must also be running on `http://localhost:5000` for login, attendance, and registrations to work.

For a complete product overview, user roles, use cases, data explanation, and sample logins, see the [main project README](../README.md).
