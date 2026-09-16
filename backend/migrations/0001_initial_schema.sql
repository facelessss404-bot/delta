-- Base schema for a clean Supabase PostgreSQL database.
-- Later migrations add the platform modules that reference these tables.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'cadet' CHECK (role IN ('commander', 'admin', 'cadet')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL UNIQUE,
  code VARCHAR(40),
  category VARCHAR(80) NOT NULL DEFAULT 'academic',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Retained for backward compatibility with earlier attendance records.
-- New attendance is stored in attendance_sessions and attendance_session_records.
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  cadet_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  status VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent')),
  marked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cadet_id, subject_id, date)
);

CREATE TABLE IF NOT EXISTS counselling_registrations (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(255),
  dob_or_age VARCHAR(80) NOT NULL,
  education_level VARCHAR(160),
  program VARCHAR(20) NOT NULL,
  mode VARCHAR(20) NOT NULL DEFAULT 'phone',
  additional_notes VARCHAR(500),
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  reference_id VARCHAR(50) NOT NULL UNIQUE,
  ip_address VARCHAR(128),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_cadet_subject ON attendance(cadet_id, subject_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_counselling_created ON counselling_registrations(created_at DESC);
