const pool = require('../config/db');
const sendMail = require('../utils/mailer');

const isStaff = (user) => ['admin', 'commander'].includes(user?.role);

// Synchronize attendance records for dates within the approved leave
const syncAttendanceForApprovedLeave = async (cadetId, startDate, endDate, actorId) => {
  try {
    await pool.query(`
      UPDATE attendance_session_records r
      SET status = 'leave', updated_by = $1, updated_at = CURRENT_TIMESTAMP
      FROM attendance_sessions s
      WHERE r.session_id = s.id
      AND r.cadet_id = $2
      AND s.session_date BETWEEN $3::date AND $4::date
    `, [actorId, cadetId, startDate, endDate]);
  } catch (error) {
    console.warn('Could not sync attendance records for leave:', error.message);
  }
};

const getLeaves = async (req, res) => {
  try {
    const own = req.user.role === 'cadet';
    const r = await pool.query(`
      SELECT l.*, u.name AS cadet_name, u.email AS cadet_email, p.roll_no, p.batch, p.programme,
        r.name AS reviewer_name 
      FROM leaves l 
      JOIN users u ON u.id = l.cadet_id 
      LEFT JOIN cadet_profiles p ON p.user_id = u.id
      LEFT JOIN users r ON r.id = l.reviewed_by 
      ${own ? 'WHERE l.cadet_id = $1' : ''} 
      ORDER BY l.created_at DESC
    `, own ? [req.user.id] : []);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const createLeave = async (req, res) => {
  try {
    const { start_date, end_date, reason, cadet_id, reviewer_remarks } = req.body;
    if (!start_date || !end_date || !reason) {
      return res.status(400).json({ message: 'Start date, end date, and reason are required' });
    }

    const targetCadetId = isStaff(req.user) && cadet_id ? cadet_id : req.user.id;
    const isDirectGrant = isStaff(req.user) && targetCadetId !== req.user.id;
    const initialStatus = isDirectGrant ? 'approved' : 'pending';
    const reviewedBy = isDirectGrant ? req.user.id : null;
    const remarks = isDirectGrant ? (reviewer_remarks || 'Direct leave approved by academy command') : null;

    const r = await pool.query(`
      INSERT INTO leaves (cadet_id, start_date, end_date, reason, status, reviewed_by, reviewed_at, reviewer_remarks) 
      VALUES ($1, $2, $3, $4, $5, $6, ${isDirectGrant ? 'CURRENT_TIMESTAMP' : 'NULL'}, $7) 
      RETURNING *
    `, [targetCadetId, start_date, end_date, reason.trim(), initialStatus, reviewedBy, remarks]);

    const createdLeave = r.rows[0];

    // If directly granted as approved by staff, automatically sync attendance records
    if (isDirectGrant) {
      await syncAttendanceForApprovedLeave(targetCadetId, start_date, end_date, req.user.id);
      
      // Notify the cadet
      const cadet = await pool.query(
        'SELECT u.id, u.email, COALESCE(s.email_notifications, true) AS email_notifications FROM users u LEFT JOIN user_settings s ON s.user_id = u.id WHERE u.id = $1',
        [targetCadetId]
      );
      if (cadet.rows[0]) {
        const msg = `Official full-day leave granted for ${new Date(start_date).toLocaleDateString()} to ${new Date(end_date).toLocaleDateString()}.`;
        await pool.query(
          'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
          [cadet.rows[0].id, 'Leave granted by command', msg, 'leave_review']
        );
        if (cadet.rows[0].email_notifications) {
          sendMail({ to: cadet.rows[0].email, subject: 'Delta Squad - Official Leave Granted', html: `<p>${msg}</p>` });
        }
      }
    }

    res.status(201).json(createdLeave);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const reviewLeave = async (req, res) => {
  try {
    const { status, reviewer_remarks } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const r = await pool.query(`
      UPDATE leaves 
      SET status = $1, reviewer_remarks = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP 
      WHERE id = $4 
      RETURNING *
    `, [status, reviewer_remarks || null, req.user.id, req.params.id]);

    if (!r.rows.length) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    const leave = r.rows[0];

    // If approved, update existing attendance sessions on those days to 'leave'
    if (status === 'approved') {
      await syncAttendanceForApprovedLeave(leave.cadet_id, leave.start_date, leave.end_date, req.user.id);
    }

    const cadet = await pool.query(
      'SELECT u.id, u.email, COALESCE(s.email_notifications, true) AS email_notifications FROM users u LEFT JOIN user_settings s ON s.user_id = u.id WHERE u.id = $1',
      [leave.cadet_id]
    );

    if (cadet.rows[0]) {
      const message = `Your leave request for ${new Date(leave.start_date).toLocaleDateString()} to ${new Date(leave.end_date).toLocaleDateString()} has been ${status}.`;
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
        [cadet.rows[0].id, 'Leave request updated', message, 'leave_review']
      );
      if (cadet.rows[0].email_notifications) {
        sendMail({ to: cadet.rows[0].email, subject: 'Delta Squad leave request', html: `<p>${message}</p>` });
      }
    }

    res.json(leave);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const deleteLeave = async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM leaves WHERE id = $1', [req.params.id]);
    if (!r.rows.length) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    if (req.user.role === 'cadet' && (r.rows[0].cadet_id !== req.user.id || r.rows[0].status !== 'pending')) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await pool.query('DELETE FROM leaves WHERE id = $1', [req.params.id]);
    res.json({ message: 'Leave deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = {
  getLeaves,
  createLeave,
  reviewLeave,
  deleteLeave,
  syncAttendanceForApprovedLeave
};
