const pool = require('../config/db');

// Helper to escape CSV cell values
const escapeCsv = (val) => {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');
  // Format dates cleanly if ISO string
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
    str = val.split('T')[0];
  }
  return `"${str}"`;
};

const sendCsvResponse = (res, filename, headers, rows) => {
  // UTF-8 BOM so Excel opens it with correct character encoding
  const BOM = '\uFEFF';
  const csvContent = BOM + [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(escapeCsv).join(','))
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
};

// 1. Export Attendance Sessions and Cadet Records
const exportAttendance = async (req, res) => {
  try {
    const { startDate, endDate, batch } = req.query;
    let query = `
      SELECT 
        s.session_date,
        s.start_time,
        s.end_time,
        sub.name AS subject_name,
        COALESCE(s.batch, p.batch, 'All Batches') AS batch,
        s.session_type,
        u.name AS cadet_name,
        p.roll_no,
        u.email AS cadet_email,
        r.status,
        m.name AS marked_by_name,
        r.marked_at
      FROM attendance_session_records r
      JOIN attendance_sessions s ON s.id = r.session_id
      JOIN subjects sub ON sub.id = s.subject_id
      JOIN users u ON u.id = r.cadet_id
      LEFT JOIN cadet_profiles p ON p.user_id = u.id
      LEFT JOIN users m ON m.id = r.marked_by
      WHERE 1=1
    `;
    const params = [];
    if (startDate) {
      params.push(startDate);
      query += ` AND s.session_date >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      query += ` AND s.session_date <= $${params.length}`;
    }
    if (batch) {
      params.push(batch);
      query += ` AND (s.batch = $${params.length} OR p.batch = $${params.length})`;
    }
    query += ` ORDER BY s.session_date DESC, s.start_time DESC NULLS LAST, u.name ASC`;

    const result = await pool.query(query, params);
    const headers = [
      'Date', 'Start Time', 'End Time', 'Subject', 'Batch / Division',
      'Session Type', 'Cadet Name', 'Roll Number', 'Cadet Email',
      'Attendance Status', 'Marked By', 'Marked At'
    ];
    const rows = result.rows.map(r => [
      r.session_date ? new Date(r.session_date).toISOString().slice(0, 10) : '',
      r.start_time || '',
      r.end_time || '',
      r.subject_name || '',
      r.batch || '',
      r.session_type || '',
      r.cadet_name || '',
      r.roll_no || '',
      r.cadet_email || '',
      (r.status || '').toUpperCase(),
      r.marked_by_name || 'System',
      r.marked_at || ''
    ]);

    sendCsvResponse(res, `delta_squad_attendance_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Export Cadet Master Roster
const exportCadets = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        p.roll_no,
        p.batch,
        p.programme,
        COALESCE(p.status, 'active') AS status,
        u.created_at,
        COUNT(r.id)::int AS total_sessions,
        COUNT(*) FILTER (WHERE r.status = 'present')::int AS present_sessions,
        COUNT(*) FILTER (WHERE r.status = 'absent')::int AS absent_sessions,
        COUNT(*) FILTER (WHERE r.status = 'leave')::int AS leave_sessions,
        COALESCE(ROUND(100.0 * COUNT(*) FILTER (WHERE r.status = 'present') / NULLIF(COUNT(r.id) - COUNT(*) FILTER (WHERE r.status = 'leave'), 0), 1), 0) AS attendance_pct
      FROM users u
      LEFT JOIN cadet_profiles p ON p.user_id = u.id
      LEFT JOIN attendance_session_records r ON r.cadet_id = u.id
      WHERE u.role = 'cadet'
      GROUP BY u.id, u.name, u.email, p.roll_no, p.batch, p.programme, p.status, u.created_at
      ORDER BY u.name ASC
    `;
    const result = await pool.query(query);
    const headers = [
      'Cadet ID', 'Full Name', 'Email', 'Roll Number', 'Batch',
      'Training Category / Programme', 'Status', 'Registered Date',
      'Total Sessions', 'Present Count', 'Absent Count', 'Leave Count', 'Attendance %'
    ];
    const rows = result.rows.map(r => [
      r.id,
      r.name,
      r.email,
      r.roll_no || '',
      r.batch || '',
      r.programme || '',
      (r.status || 'ACTIVE').toUpperCase(),
      r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : '',
      r.total_sessions || 0,
      r.present_sessions || 0,
      r.absent_sessions || 0,
      r.leave_sessions || 0,
      `${r.attendance_pct || 0}%`
    ]);

    sendCsvResponse(res, `delta_squad_cadet_roster_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Export Academic Assessments and Marks
const exportAcademics = async (req, res) => {
  try {
    const query = `
      SELECT 
        a.title AS assessment_title,
        a.assessment_type,
        s.name AS subject_name,
        a.assessment_date,
        a.max_marks,
        u.name AS cadet_name,
        p.roll_no,
        u.email AS cadet_email,
        m.marks,
        ROUND((m.marks / a.max_marks) * 100, 1) AS percentage,
        m.remarks,
        e.name AS entered_by_name
      FROM assessment_marks m
      JOIN assessments a ON a.id = m.assessment_id
      LEFT JOIN subjects s ON s.id = a.subject_id
      JOIN users u ON u.id = m.cadet_id
      LEFT JOIN cadet_profiles p ON p.user_id = u.id
      LEFT JOIN users e ON e.id = m.entered_by
      ORDER BY a.assessment_date DESC, a.title ASC, u.name ASC
    `;
    const result = await pool.query(query);
    const headers = [
      'Assessment Title', 'Type', 'Subject', 'Date', 'Max Marks',
      'Cadet Name', 'Roll Number', 'Email', 'Marks Scored', 'Percentage (%)',
      'Faculty Remarks', 'Entered By'
    ];
    const rows = result.rows.map(r => [
      r.assessment_title,
      r.assessment_type,
      r.subject_name || '',
      r.assessment_date ? new Date(r.assessment_date).toISOString().slice(0, 10) : '',
      r.max_marks,
      r.cadet_name,
      r.roll_no || '',
      r.cadet_email,
      r.marks,
      `${r.percentage || 0}%`,
      r.remarks || '',
      r.entered_by_name || ''
    ]);

    sendCsvResponse(res, `delta_squad_academics_marks_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Export Physical Training Submissions
const exportPhysical = async (req, res) => {
  try {
    const query = `
      SELECT 
        ps.activity_type,
        ps.activity_date,
        u.name AS cadet_name,
        p.roll_no,
        u.email AS cadet_email,
        ps.upload_status,
        ps.review_status,
        rev.name AS reviewed_by_name,
        ps.reviewed_at,
        ps.reviewer_comment,
        ps.created_at AS uploaded_at
      FROM physical_submissions ps
      JOIN users u ON u.id = ps.cadet_id
      LEFT JOIN cadet_profiles p ON p.user_id = u.id
      LEFT JOIN users rev ON rev.id = ps.reviewed_by
      ORDER BY ps.activity_date DESC, u.name ASC
    `;
    const result = await pool.query(query);
    const headers = [
      'Activity Type', 'Activity Date', 'Cadet Name', 'Roll Number', 'Cadet Email',
      'Upload Status', 'Review Status', 'Reviewed By', 'Reviewed At', 'Reviewer Comment', 'Uploaded At'
    ];
    const rows = result.rows.map(r => [
      r.activity_type,
      r.activity_date ? new Date(r.activity_date).toISOString().slice(0, 10) : '',
      r.cadet_name,
      r.roll_no || '',
      r.cadet_email,
      (r.upload_status || '').toUpperCase(),
      (r.review_status || '').toUpperCase(),
      r.reviewed_by_name || '',
      r.reviewed_at ? new Date(r.reviewed_at).toISOString().slice(0, 10) : '',
      r.reviewer_comment || '',
      r.uploaded_at ? new Date(r.uploaded_at).toISOString().slice(0, 10) : ''
    ]);

    sendCsvResponse(res, `delta_squad_physical_training_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Export Cadet Leaves Log
const exportLeaves = async (req, res) => {
  try {
    const query = `
      SELECT 
        l.id AS leave_id,
        u.name AS cadet_name,
        p.roll_no,
        p.batch,
        u.email AS cadet_email,
        l.start_date,
        l.end_date,
        l.reason,
        l.status,
        rev.name AS reviewer_name,
        l.reviewer_remarks,
        l.created_at AS submitted_at,
        l.reviewed_at
      FROM leaves l
      JOIN users u ON u.id = l.cadet_id
      LEFT JOIN cadet_profiles p ON p.user_id = u.id
      LEFT JOIN users rev ON rev.id = l.reviewed_by
      ORDER BY l.start_date DESC, l.created_at DESC
    `;
    const result = await pool.query(query);
    const headers = [
      'Leave ID', 'Cadet Name', 'Roll Number', 'Batch', 'Email',
      'Start Date', 'End Date', 'Reason', 'Status', 'Reviewed By',
      'Command Remarks', 'Submitted At', 'Reviewed At'
    ];
    const rows = result.rows.map(r => [
      r.leave_id,
      r.cadet_name,
      r.roll_no || '',
      r.batch || '',
      r.cadet_email,
      r.start_date ? new Date(r.start_date).toISOString().slice(0, 10) : '',
      r.end_date ? new Date(r.end_date).toISOString().slice(0, 10) : '',
      r.reason,
      (r.status || '').toUpperCase(),
      r.reviewer_name || '',
      r.reviewer_remarks || '',
      r.submitted_at ? new Date(r.submitted_at).toISOString().slice(0, 10) : '',
      r.reviewed_at ? new Date(r.reviewed_at).toISOString().slice(0, 10) : ''
    ]);

    sendCsvResponse(res, `delta_squad_leaves_report_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Export Weekly Timetable Schedule
const exportTimetable = async (req, res) => {
  try {
    const query = `
      SELECT 
        t.schedule_title,
        t.day_of_week,
        t.slot_order,
        t.time_display,
        t.activity,
        t.instructor,
        t.category,
        s.name AS linked_subject
      FROM timetable_slots t
      LEFT JOIN subjects s ON s.id = t.subject_id
      ORDER BY t.schedule_key, 
        CASE t.day_of_week
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
          ELSE 7
        END,
        t.slot_order ASC
    `;
    const result = await pool.query(query);
    const headers = [
      'Division / Programme', 'Day of Week', 'Period Number', 'Time Slot',
      'Activity / Subject', 'Faculty / Instructor', 'Category', 'Mapped Course'
    ];
    const rows = result.rows.map(r => [
      r.schedule_title,
      r.day_of_week,
      r.slot_order,
      r.time_display,
      r.activity,
      r.instructor || '',
      (r.category || '').toUpperCase(),
      r.linked_subject || ''
    ]);

    sendCsvResponse(res, `delta_squad_timetable_master_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. Export Counselling Registrations
const exportRegistrations = async (req, res) => {
  try {
    const query = `
      SELECT 
        reference_id,
        full_name,
        phone,
        email,
        dob_or_age,
        education_level,
        program,
        mode,
        additional_notes,
        created_at
      FROM counselling_registrations
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    const headers = [
      'Reference ID', 'Applicant Name', 'Phone', 'Email',
      'DOB / Age', 'Education Level', 'Program (JLP/SLP/YLP/SSLP)',
      'Preferred Mode', 'Additional Notes', 'Submitted Date'
    ];
    const rows = result.rows.map(r => [
      r.reference_id,
      r.full_name,
      r.phone,
      r.email || '',
      r.dob_or_age || '',
      r.education_level || '',
      r.program,
      (r.mode || '').toUpperCase(),
      r.additional_notes || '',
      r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : ''
    ]);

    sendCsvResponse(res, `delta_squad_counselling_registrations_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  exportAttendance,
  exportCadets,
  exportAcademics,
  exportPhysical,
  exportLeaves,
  exportTimetable,
  exportRegistrations
};
