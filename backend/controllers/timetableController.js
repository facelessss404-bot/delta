const pool = require('../config/db');
const { writeAudit } = require('../utils/audit');

const SCHEDULE_META = [
  { key: 'grade_8_10', title: 'Grade 8th - 10th (JLP)', programme: 'Grade 8th-10th', description: 'Junior Leaders Programme core routine & academic syllabus' },
  { key: 'grade_11_12', title: 'Grade 11th & 12th', programme: 'Grade 11th-12th', description: 'Higher secondary senior cadet science, commerce & defence focus' },
  { key: 'nda', title: 'NDA Foundation', programme: 'NDA Foundation', description: 'National Defence Academy foundation & officer prep curriculum' }
];

const mapProgrammeToKey = (programme) => {
  if (!programme) return 'nda';
  const p = programme.toLowerCase();
  if (p.includes('8') || p.includes('10') || p.includes('jlp')) return 'grade_8_10';
  if (p.includes('11') || p.includes('12')) return 'grade_11_12';
  return 'nda';
};

const getDayName = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleDateString('en-US', { weekday: 'long' });
};

const getSchedules = async (req, res) => {
  try {
    const counts = await pool.query(`
      SELECT schedule_key, COUNT(*)::int AS slot_count
      FROM timetable_slots
      GROUP BY schedule_key
    `);
    const countMap = Object.fromEntries(counts.rows.map(r => [r.schedule_key, r.slot_count]));
    const result = SCHEDULE_META.map(s => ({
      ...s,
      slotCount: countMap[s.key] || 0
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTimetableSlots = async (req, res) => {
  try {
    const { scheduleKey, dayOfWeek, category, trackableOnly } = req.query;
    let query = `
      SELECT t.*, s.name AS subject_name, s.code AS subject_code
      FROM timetable_slots t
      LEFT JOIN subjects s ON s.id = t.subject_id
      WHERE 1=1
    `;
    const params = [];

    if (scheduleKey) {
      params.push(scheduleKey);
      query += ` AND t.schedule_key = $${params.length}`;
    }
    if (dayOfWeek) {
      params.push(dayOfWeek);
      query += ` AND LOWER(t.day_of_week) = LOWER($${params.length})`;
    }
    if (category) {
      params.push(category);
      query += ` AND t.category = $${params.length}`;
    }
    if (trackableOnly === 'true') {
      query += ` AND t.trackable = TRUE`;
    }

    query += ` ORDER BY t.schedule_key, 
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

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyTimetable = async (req, res) => {
  try {
    const cadetId = req.user.role === 'cadet' ? req.user.id : (req.query.cadetId || req.user.id);
    
    // Get cadet profile
    const profileRes = await pool.query(
      'SELECT cp.*, u.name, u.email FROM users u LEFT JOIN cadet_profiles cp ON cp.user_id = u.id WHERE u.id = $1',
      [cadetId]
    );
    const profile = profileRes.rows[0] || {};
    const scheduleKey = req.query.scheduleKey || mapProgrammeToKey(profile.programme);
    const scheduleInfo = SCHEDULE_META.find(s => s.key === scheduleKey) || SCHEDULE_META[2];

    // Check if cadet has active approved leave today
    const todayStr = new Date().toISOString().slice(0, 10);
    const leaveRes = await pool.query(`
      SELECT * FROM leaves
      WHERE cadet_id = $1 AND status = 'approved'
      AND $2::date BETWEEN start_date::date AND end_date::date
      ORDER BY id DESC LIMIT 1
    `, [cadetId, todayStr]);

    // Fetch timetable slots
    const slotsRes = await pool.query(`
      SELECT t.*, s.name AS subject_name, s.code AS subject_code
      FROM timetable_slots t
      LEFT JOIN subjects s ON s.id = t.subject_id
      WHERE t.schedule_key = $1
      ORDER BY 
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
    `, [scheduleKey]);

    res.json({
      schedule: scheduleInfo,
      cadet: {
        id: cadetId,
        name: profile.name,
        email: profile.email,
        roll_no: profile.roll_no,
        batch: profile.batch,
        programme: profile.programme
      },
      activeLeaveToday: leaveRes.rows[0] || null,
      slots: slotsRes.rows
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTodaySchedule = async (req, res) => {
  try {
    const { scheduleKey, date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const dayOfWeek = getDayName(targetDate.toISOString().slice(0, 10));
    const targetKey = scheduleKey || 'nda';

    const slotsRes = await pool.query(`
      SELECT t.*, s.name AS subject_name, s.code AS subject_code
      FROM timetable_slots t
      LEFT JOIN subjects s ON s.id = t.subject_id
      WHERE t.schedule_key = $1 AND LOWER(t.day_of_week) = LOWER($2)
      ORDER BY t.slot_order ASC
    `, [targetKey, dayOfWeek]);

    const slots = slotsRes.rows;

    // Determine current active slot based on local time
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMins = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMins}`;

    let currentSlot = null;
    let nextSlot = null;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (slot.start_time && slot.end_time) {
        if (currentTimeStr >= slot.start_time && currentTimeStr < slot.end_time) {
          currentSlot = slot;
          nextSlot = slots[i + 1] || null;
          break;
        } else if (currentTimeStr < slot.start_time && !nextSlot) {
          nextSlot = slot;
        }
      }
    }

    res.json({
      dayOfWeek,
      date: targetDate.toISOString().slice(0, 10),
      scheduleKey: targetKey,
      totalSlots: slots.length,
      currentSlot,
      nextSlot,
      slots
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSlot = async (req, res) => {
  try {
    const {
      schedule_key, schedule_title, programme, day_of_week, slot_order,
      start_time, end_time, time_display, activity, instructor,
      category, trackable, subject_id, raw_text
    } = req.body;

    if (!schedule_key || !day_of_week || !start_time || !activity) {
      return res.status(400).json({ message: 'Schedule, day, start time, and activity are required' });
    }

    const result = await pool.query(`
      INSERT INTO timetable_slots (
        schedule_key, schedule_title, programme, day_of_week, slot_order,
        start_time, end_time, time_display, activity, instructor,
        category, trackable, subject_id, raw_text
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *
    `, [
      schedule_key,
      schedule_title || schedule_key,
      programme || null,
      day_of_week,
      slot_order || 1,
      start_time,
      end_time || null,
      time_display || `${start_time} - ${end_time || ''}`,
      activity,
      instructor || null,
      category || 'academic',
      trackable !== false,
      subject_id || null,
      raw_text || activity
    ]);

    await writeAudit({
      actorId: req.user.id,
      action: 'timetable_slot.created',
      entityType: 'timetable_slot',
      entityId: result.rows[0].id,
      after: result.rows[0]
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      activity, instructor, category, start_time, end_time,
      time_display, trackable, subject_id
    } = req.body;

    const before = await pool.query('SELECT * FROM timetable_slots WHERE id = $1', [id]);
    if (!before.rows.length) {
      return res.status(404).json({ message: 'Timetable slot not found' });
    }

    const result = await pool.query(`
      UPDATE timetable_slots SET
        activity = COALESCE($1, activity),
        instructor = COALESCE($2, instructor),
        category = COALESCE($3, category),
        start_time = COALESCE($4, start_time),
        end_time = COALESCE($5, end_time),
        time_display = COALESCE($6, time_display),
        trackable = COALESCE($7, trackable),
        subject_id = COALESCE($8, subject_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [
      activity, instructor, category, start_time, end_time,
      time_display, trackable, subject_id, id
    ]);

    await writeAudit({
      actorId: req.user.id,
      action: 'timetable_slot.updated',
      entityType: 'timetable_slot',
      entityId: id,
      before: before.rows[0],
      after: result.rows[0]
    });

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const before = await pool.query('SELECT * FROM timetable_slots WHERE id = $1', [id]);
    if (!before.rows.length) {
      return res.status(404).json({ message: 'Timetable slot not found' });
    }

    await pool.query('DELETE FROM timetable_slots WHERE id = $1', [id]);

    await writeAudit({
      actorId: req.user.id,
      action: 'timetable_slot.deleted',
      entityType: 'timetable_slot',
      entityId: id,
      before: before.rows[0]
    });

    res.json({ message: 'Timetable slot deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSchedules,
  getTimetableSlots,
  getMyTimetable,
  getTodaySchedule,
  createSlot,
  updateSlot,
  deleteSlot
};
