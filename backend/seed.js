require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

// Development-only, additive seed. It never deletes or overwrites existing data.
const seed = async () => {
  const users = [
    ['Training Commander', 'commander@commander.com', 'commander'],
    ['Admin Officer', 'admin@admin.com', 'admin'],
    ['Cadet', 'cadet@cadet.com', 'cadet']
  ];
  try {
    const password = await bcrypt.hash('password123', 10);
    for (const [name, email, role] of users) {
      await pool.query('INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,$4) ON CONFLICT (email) DO NOTHING', [name, email, password, role]);
    }
    for (const name of ['Physics', 'Mathematics', 'SSB', 'JEE']) {
      await pool.query('INSERT INTO subjects(name) VALUES($1) ON CONFLICT (name) DO NOTHING', [name]);
    }
    const cadets = await pool.query("SELECT id FROM users WHERE role='cadet'");
    const subjects = await pool.query('SELECT id FROM subjects WHERE active=true');
    for (const cadet of cadets.rows) {
      await pool.query('INSERT INTO cadet_profiles(user_id) VALUES($1) ON CONFLICT(user_id) DO NOTHING', [cadet.id]);
      for (const subject of subjects.rows) await pool.query('INSERT INTO subject_assignments(cadet_id,subject_id) VALUES($1,$2) ON CONFLICT(cadet_id,subject_id) DO NOTHING', [cadet.id, subject.id]);
    }
    console.log('PostgreSQL development accounts and confirmed subjects are available.');
  } finally { await pool.end(); }
};
seed().catch((error) => { console.error(`Seed failed: ${error.message}`); process.exitCode = 1; });
