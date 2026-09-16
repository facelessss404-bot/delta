-- Delta Squad platform extensions. Existing users, subjects, and attendance remain unchanged.

-- Keep older databases compatible with the configurable subject catalogue.
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS code VARCHAR(40);
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS category VARCHAR(80) NOT NULL DEFAULT 'academic';
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS cadet_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  roll_no VARCHAR(80) UNIQUE,
  batch VARCHAR(100),
  programme VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subject_assignments (
  id SERIAL PRIMARY KEY,
  cadet_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  batch VARCHAR(100),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cadet_id, subject_id)
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  batch VARCHAR(100),
  session_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  session_type VARCHAR(80) NOT NULL DEFAULT 'class',
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_session_records (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  cadet_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent')),
  marked_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, cadet_id)
);

CREATE TABLE IF NOT EXISTS assessments (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  assessment_type VARCHAR(80) NOT NULL DEFAULT 'written',
  assessment_date DATE NOT NULL,
  max_marks NUMERIC(8,2) NOT NULL CHECK (max_marks > 0),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_marks (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  cadet_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  marks NUMERIC(8,2) NOT NULL CHECK (marks >= 0),
  remarks TEXT,
  entered_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(assessment_id, cadet_id)
);

CREATE TABLE IF NOT EXISTS physical_submissions (
  id SERIAL PRIMARY KEY,
  cadet_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  activity_date DATE NOT NULL,
  storage_key VARCHAR(500) NOT NULL UNIQUE,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size >= 0),
  upload_status VARCHAR(20) NOT NULL DEFAULT 'pending_upload' CHECK (upload_status IN ('pending_upload', 'uploaded', 'failed')),
  review_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'accepted', 'rejected')),
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  reviewer_comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100),
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_session_records_cadet ON attendance_session_records(cadet_id, session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_subject_date ON attendance_sessions(subject_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_marks_cadet ON assessment_marks(cadet_id, assessment_id);
CREATE INDEX IF NOT EXISTS idx_physical_cadet ON physical_submissions(cadet_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC);

INSERT INTO subjects (name)
SELECT 'SSB'
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE LOWER(name) = 'ssb');
