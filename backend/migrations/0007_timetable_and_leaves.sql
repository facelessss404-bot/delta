-- 0007_timetable_and_leaves.sql
-- Add support for timetable preset slots and approved leave status in attendance

-- 1. Allow 'leave' status in attendance_session_records
ALTER TABLE attendance_session_records DROP CONSTRAINT IF EXISTS attendance_session_records_status_check;
ALTER TABLE attendance_session_records ADD CONSTRAINT attendance_session_records_status_check 
  CHECK (status IN ('present', 'absent', 'leave'));

-- 2. Allow 'leave' status in legacy attendance table
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
ALTER TABLE attendance ADD CONSTRAINT attendance_status_check 
  CHECK (status IN ('present', 'absent', 'leave'));

-- 3. Create timetable_slots table
CREATE TABLE IF NOT EXISTS timetable_slots (
  id SERIAL PRIMARY KEY,
  schedule_key VARCHAR(50) NOT NULL,
  schedule_title VARCHAR(100) NOT NULL,
  programme VARCHAR(100),
  day_of_week VARCHAR(20) NOT NULL,
  slot_order INTEGER NOT NULL,
  start_time VARCHAR(20) NOT NULL,
  end_time VARCHAR(20),
  time_display VARCHAR(50) NOT NULL,
  activity VARCHAR(200) NOT NULL,
  instructor VARCHAR(100),
  category VARCHAR(50) NOT NULL DEFAULT 'academic',
  trackable BOOLEAN NOT NULL DEFAULT TRUE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  raw_text VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timetable_schedule_day ON timetable_slots(schedule_key, day_of_week, slot_order);
CREATE INDEX IF NOT EXISTS idx_timetable_programme ON timetable_slots(programme);

-- 4. Ensure standard subjects exist for the timetable
INSERT INTO subjects (name, code, category, active)
VALUES
  ('Science', 'SCI-101', 'academic', TRUE),
  ('Social Studies (SST)', 'SST-101', 'academic', TRUE),
  ('Commerce / B.Com', 'COM-101', 'academic', TRUE),
  ('Chemistry', 'CHE-101', 'academic', TRUE),
  ('Military History', 'MH-101', 'military', TRUE),
  ('Painting & Fine Arts', 'ART-101', 'academic', TRUE),
  ('Previous Year Questions (PYQ)', 'PYQ-101', 'academic', TRUE),
  ('Games & Sports', 'GAMES-101', 'physical', TRUE),
  ('Supervised Study Hours', 'STUDY-101', 'academic', TRUE),
  ('National Open School (NIOS)', 'NIOS-101', 'academic', TRUE)
ON CONFLICT (name) DO UPDATE SET active = TRUE;
