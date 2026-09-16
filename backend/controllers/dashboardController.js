const pool = require('../config/db');

const subjectAttendance = () => pool.query(`SELECT s.id AS subject_id,s.name,
  COUNT(r.id)::int AS total_records,
  COUNT(*) FILTER (WHERE r.status='present')::int AS present_count,
  COALESCE(ROUND(100.0*COUNT(*) FILTER (WHERE r.status='present')/NULLIF(COUNT(r.id),0),1),0) AS percentage
  FROM subjects s LEFT JOIN attendance_sessions x ON x.subject_id=s.id
  LEFT JOIN attendance_session_records r ON r.session_id=x.id GROUP BY s.id,s.name ORDER BY s.name`);

const getStaffDashboard = async (_req, res) => {
  try {
    const [statsResult, subjectsResult, recentMarksResult, recentPhysicalResult, lowAttendanceResult] = await Promise.all([
      pool.query(`SELECT (SELECT COUNT(*)::int FROM users WHERE role='cadet' AND id IN (SELECT user_id FROM cadet_profiles WHERE status='active')) AS active_cadets,(SELECT COUNT(*)::int FROM users WHERE role='cadet') AS total_cadets,(SELECT COUNT(*)::int FROM users WHERE role='admin') AS active_admins,(SELECT COUNT(*)::int FROM physical_submissions WHERE review_status='pending') AS pending_physical_reviews,(SELECT COUNT(*)::int FROM assessments) AS total_assessments,COALESCE((SELECT ROUND(100.0*COUNT(*) FILTER (WHERE status='present')/NULLIF(COUNT(*),0),1) FROM attendance_session_records),0) AS overall_attendance_percentage`),
      subjectAttendance(),
      pool.query(`SELECT m.id,m.marks,m.entered_at,u.name AS cadet_name,a.title AS assessment_title,a.max_marks,s.name AS subject_name FROM assessment_marks m JOIN users u ON u.id=m.cadet_id JOIN assessments a ON a.id=m.assessment_id LEFT JOIN subjects s ON s.id=a.subject_id ORDER BY m.updated_at DESC,m.id DESC LIMIT 6`),
      pool.query(`SELECT p.id,p.activity_type,p.activity_date,p.review_status,u.name AS cadet_name FROM physical_submissions p JOIN users u ON u.id=p.cadet_id ORDER BY p.created_at DESC,p.id DESC LIMIT 6`),
      pool.query(`SELECT u.name,ROUND(100.0*COUNT(*) FILTER (WHERE r.status='present')/NULLIF(COUNT(r.id),0),1) AS percentage FROM users u JOIN attendance_session_records r ON r.cadet_id=u.id WHERE u.role='cadet' GROUP BY u.id,u.name HAVING COUNT(r.id) >= 3 AND 100.0*COUNT(*) FILTER (WHERE r.status='present')/NULLIF(COUNT(r.id),0) < 75 ORDER BY percentage ASC LIMIT 5`),
    ]);
    const stats = statsResult.rows[0];
    const alerts = [
      ...(Number(stats.pending_physical_reviews) ? [{ type: 'physical', message: `${stats.pending_physical_reviews} physical submission${Number(stats.pending_physical_reviews) === 1 ? '' : 's'} await review.` }] : []),
      ...lowAttendanceResult.rows.map((cadet) => ({ type: 'attendance', message: `${cadet.name} has ${cadet.percentage}% attendance.` })),
    ];
    res.json({ stats, subjectWiseAttendance: subjectsResult.rows, recentAcademicUpdates: recentMarksResult.rows, recentPhysicalSubmissions: recentPhysicalResult.rows, alerts });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getCommanderDashboard = getStaffDashboard;
const getAdminDashboard = getStaffDashboard;

const getCadetDashboard = async (req, res) => {
  try {
    const cadetId = req.user.id;
    const [attendanceResult, marksResult, physicalResult, subjectResult] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total_sessions,COUNT(*) FILTER (WHERE status='present')::int AS present_sessions,COALESCE(ROUND(100.0*COUNT(*) FILTER (WHERE status='present')/NULLIF(COUNT(*),0),1),0) AS attendance_percentage FROM attendance_session_records WHERE cadet_id=$1`, [cadetId]),
      pool.query(`SELECT COUNT(*)::int AS assessment_count,COALESCE(ROUND(AVG(100.0*m.marks/a.max_marks),1),0) AS average_mark_percentage FROM assessment_marks m JOIN assessments a ON a.id=m.assessment_id WHERE m.cadet_id=$1`, [cadetId]),
      pool.query(`SELECT COUNT(*)::int AS total_submissions,COUNT(*) FILTER (WHERE review_status='pending')::int AS pending_submissions,COUNT(*) FILTER (WHERE review_status='accepted')::int AS accepted_submissions FROM physical_submissions WHERE cadet_id=$1`, [cadetId]),
      pool.query(`SELECT s.id AS subject_id,s.name,s.category,COUNT(r.id)::int AS total_sessions,COUNT(*) FILTER (WHERE r.status='present')::int AS present_count,COUNT(*) FILTER (WHERE r.status='absent')::int AS absent_count,COALESCE(ROUND(100.0*COUNT(*) FILTER (WHERE r.status='present')/NULLIF(COUNT(r.id),0),1),0) AS percentage FROM subject_assignments sa JOIN subjects s ON s.id=sa.subject_id LEFT JOIN attendance_sessions a ON a.subject_id=s.id AND (sa.batch IS NULL OR a.batch IS NULL OR a.batch=sa.batch) LEFT JOIN attendance_session_records r ON r.session_id=a.id AND r.cadet_id=sa.cadet_id WHERE sa.cadet_id=$1 GROUP BY s.id,s.name,s.category ORDER BY s.name`, [cadetId]),
    ]);
    res.json({ stats: { ...attendanceResult.rows[0], ...marksResult.rows[0], ...physicalResult.rows[0] }, subjectAttendance: subjectResult.rows });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getCommanderDashboard, getAdminDashboard, getCadetDashboard };
