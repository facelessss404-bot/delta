const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const sendMail = require('../utils/mailer');

const token = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role = 'cadet' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must contain at least 8 characters' });
    if (!['admin', 'cadet'].includes(role)) return res.status(400).json({ message: 'Only admin or cadet accounts can be created' });
    if (req.user.role === 'admin' && role !== 'cadet') return res.status(403).json({ message: 'Admins can create cadets only' });
    const found = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase().trim()]);
    if (found.rows.length) return res.status(400).json({ message: 'User already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query('INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role', [name.trim(), email.toLowerCase().trim(), hashed, role]);
    const user = result.rows[0];
    sendMail({ to: user.email, subject: 'Welcome to Delta Squad', html: `<p>Hello ${user.name}, your cadet account is ready.</p>` });
    res.status(201).json({ _id: user.id, ...user, token: token(user.id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cadetSignUp = async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, email, password, category = 'JLP', phone, rollNo: customRollNo, batch = '2025-2026' } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Full name is required' });
    if (!email || !email.trim()) return res.status(400).json({ message: 'Email address is required' });
    if (!password || password.length < 8) return res.status(400).json({ message: 'Password must contain at least 8 characters' });

    // Normalize category: JLP (Classes 8–12), SLP (Graduates), SSLP (Online Attendees)
    let normCategory = (category || 'JLP').toUpperCase().trim();
    if (normCategory === 'JLB' || normCategory === 'DAH') normCategory = 'JLP';
    if (normCategory === 'SLB') normCategory = 'SLP';
    if (normCategory === 'SSLB') normCategory = 'SSLP';

    if (!['JLP', 'SLP', 'SSLP'].includes(normCategory)) {
      return res.status(400).json({ message: 'Invalid category. Must be one of JLP (Classes 8–12), SLP (Graduates), or SSLP (Online Attendees)' });
    }

    await client.query('BEGIN');
    const existing = await client.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase().trim()]);
    if (existing.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'An account with this email address already exists. Please sign in instead.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userRes = await client.query(
      "INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, 'cadet') RETURNING id, name, email, role, created_at",
      [name.trim(), email.toLowerCase().trim(), hashed]
    );
    const user = userRes.rows[0];

    // Generate unique roll number if not provided
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const rollNo = (customRollNo && customRollNo.trim()) ? customRollNo.trim() : `DS-${normCategory}-${randSuffix}`;

    const profileRes = await client.query(
      'INSERT INTO cadet_profiles(user_id, roll_no, batch, programme, status) VALUES($1, $2, $3, $4, $5) RETURNING roll_no, batch, programme, status',
      [user.id, rollNo, batch.trim(), normCategory, 'active']
    );
    const profile = profileRes.rows[0];

    // Auto-assign existing active subjects to this cadet
    const activeSubjects = await client.query('SELECT id FROM subjects WHERE active=true');
    if (activeSubjects.rows.length) {
      for (const subj of activeSubjects.rows) {
        await client.query(
          'INSERT INTO subject_assignments(cadet_id, subject_id, batch) VALUES($1, $2, $3) ON CONFLICT DO NOTHING',
          [user.id, subj.id, batch.trim()]
        );
      }
    }

    await client.query('COMMIT');

    try {
      sendMail({
        to: user.email,
        subject: 'Welcome to Delta Squad Foundation',
        html: `<p>Welcome, Cadet <strong>${user.name}</strong>! Your account has been registered for the <strong>${normCategory}</strong> division.<br/>Roll Number: <strong>${rollNo}</strong>.<br/>Batch: <strong>${batch}</strong>.</p>`
      });
    } catch (_) {}

    const payload = {
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'cadet',
      rollNo: profile.roll_no,
      batch: profile.batch,
      programme: profile.programme,
      category: profile.programme,
      status: profile.status,
      token: token(user.id)
    };

    res.status(201).json(payload);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password, category } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase().trim()]);
    if (!result.rows.length || !(await bcrypt.compare(password, result.rows[0].password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const user = result.rows[0];
    let profile = null;
    if (user.role === 'cadet') {
      const pRes = await pool.query('SELECT roll_no, batch, programme, status FROM cadet_profiles WHERE user_id=$1', [user.id]);
      if (pRes.rows.length) {
        profile = pRes.rows[0];
      } else {
        const defaultProg = category ? category.toUpperCase() : 'JLP';
        const randRoll = `DS-${defaultProg}-${Math.floor(1000 + Math.random() * 9000)}`;
        const insP = await pool.query(
          'INSERT INTO cadet_profiles(user_id, roll_no, batch, programme, status) VALUES($1, $2, $3, $4, $5) RETURNING roll_no, batch, programme, status',
          [user.id, randRoll, '2025-2026', defaultProg, 'active']
        );
        profile = insP.rows[0];
      }
    }

    res.json({
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNo: profile?.roll_no || null,
      batch: profile?.batch || null,
      programme: profile?.programme || category || null,
      category: profile?.programme || category || null,
      status: profile?.status || 'active',
      token: token(user.id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    let profile = null;
    if (req.user.role === 'cadet') {
      const pRes = await pool.query('SELECT roll_no, batch, programme, status FROM cadet_profiles WHERE user_id=$1', [req.user.id]);
      if (pRes.rows.length) profile = pRes.rows[0];
    }
    res.json({
      _id: req.user.id,
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      rollNo: profile?.roll_no || null,
      batch: profile?.batch || null,
      programme: profile?.programme || null,
      category: profile?.programme || null,
      status: profile?.status || 'active'
    });
  } catch (error) {
    res.json({
      _id: req.user.id,
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    });
  }
};

const logoutUser = (req, res) => res.status(204).end();

module.exports = { registerUser, cadetSignUp, loginUser, getCurrentUser, logoutUser };
