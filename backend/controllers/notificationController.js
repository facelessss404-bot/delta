const pool = require('../config/db');
const listNotifications = async (req, res) => { try { const result = await pool.query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100', [req.user.id]); res.json(result.rows); } catch (error) { res.status(500).json({ message: error.message }); } };
const markRead = async (req, res) => { try { const result = await pool.query('UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE id=$1 AND user_id=$2 RETURNING *', [req.params.id, req.user.id]); if (!result.rows.length) return res.status(404).json({ message: 'Notification not found' }); res.json(result.rows[0]); } catch (error) { res.status(500).json({ message: error.message }); } };
module.exports = { listNotifications, markRead };
