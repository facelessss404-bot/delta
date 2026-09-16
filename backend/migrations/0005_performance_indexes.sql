-- Query patterns used by the attendance roster and role-based cadet lists.
CREATE INDEX IF NOT EXISTS idx_subject_assignments_subject_cadet ON subject_assignments (subject_id, cadet_id);
CREATE INDEX IF NOT EXISTS idx_users_role_name ON users (role, name);
