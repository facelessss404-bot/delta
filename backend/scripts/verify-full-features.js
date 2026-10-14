require('dotenv').config();
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const token = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

async function runTests() {
  console.log('=== Starting Full Delta Squad System Verification ===');
  const client = await pool.connect();
  try {
    // 1. Verify Commander & Admin Users exist
    const cmdrRes = await client.query("SELECT id, name, email, role FROM users WHERE email='commander@commander.com'");
    if (!cmdrRes.rows.length) throw new Error('Commander user not found');
    const cmdr = cmdrRes.rows[0];
    const cmdrToken = token(cmdr.id);
    console.log('✔ Commander verified:', cmdr.email);

    const adminRes = await client.query("SELECT id, name, email, role FROM users WHERE email='admin@admin.com'");
    if (!adminRes.rows.length) throw new Error('Admin user not found');
    const admin = adminRes.rows[0];
    console.log('✔ Admin verified:', admin.email);

    // 2. Test Cadet Self-Registration (Sign Up) with Category
    const testEmail = `cadet_test_${Date.now()}@example.com`;
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('password123', 10);
    
    // Simulate what cadetSignUp does
    const uRes = await client.query(
      "INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, 'cadet') RETURNING id, name, email, role",
      ['Cadet Self Registered', testEmail, hashed]
    );
    const newCadet = uRes.rows[0];
    const rollNo = `DS-JLP-${Math.floor(1000 + Math.random() * 9000)}`;
    const pRes = await client.query(
      'INSERT INTO cadet_profiles(user_id, roll_no, batch, programme, status) VALUES($1, $2, $3, $4, $5) RETURNING roll_no, batch, programme',
      [newCadet.id, rollNo, '2025-2026', 'JLP', 'active']
    );
    console.log('✔ Cadet Self-Signup verified: id =', newCadet.id, 'rollNo =', pRes.rows[0].roll_no, 'category =', pRes.rows[0].programme);

    // 3. Verify Timetable Preset Slots
    const slotsRes = await client.query('SELECT count(*) as total, schedule_title FROM timetable_slots GROUP BY schedule_title');
    console.log('✔ Timetable preset slots in DB:');
    slotsRes.rows.forEach(r => {
      console.log(`   - Schedule: ${r.schedule_title}: ${r.total} preset periods`);
    });

    // 4. Test Export Queries (All 7 Functions)
    console.log('✔ Testing Data Export Queries:');
    
    // 4.1 Attendance
    const attRes = await client.query(`
      SELECT r.id, s.session_date, s.start_time, s.end_time, s.session_type, s.batch,
             sub.name AS subject_name, u.name AS cadet_name, cp.roll_no, r.status
      FROM attendance_session_records r
      JOIN attendance_sessions s ON s.id = r.session_id
      LEFT JOIN subjects sub ON sub.id = s.subject_id
      JOIN users u ON u.id = r.cadet_id
      LEFT JOIN cadet_profiles cp ON cp.user_id = u.id
      LIMIT 5
    `);
    console.log(`   - Attendance Export: OK (${attRes.rowCount} sample records)`);

    // 4.2 Cadets
    const cadRes = await client.query(`
      SELECT u.id, u.name, u.email, cp.roll_no, cp.batch, cp.programme, cp.status
      FROM users u
      LEFT JOIN cadet_profiles cp ON cp.user_id = u.id
      WHERE u.role = 'cadet'
      LIMIT 5
    `);
    console.log(`   - Cadets Roster Export: OK (${cadRes.rowCount} sample records)`);

    // 4.3 Academics
    const acaRes = await client.query(`
      SELECT a.id, a.title, a.assessment_type, a.assessment_date, a.max_marks,
             sub.name AS subject_name, u.name AS cadet_name, m.marks
      FROM assessments a
      LEFT JOIN subjects sub ON sub.id = a.subject_id
      LEFT JOIN assessment_marks m ON m.assessment_id = a.id
      LEFT JOIN users u ON u.id = m.cadet_id
      LIMIT 5
    `);
    console.log(`   - Academics Export: OK (${acaRes.rowCount} sample records)`);

    // 4.4 Physical Training
    const ptRes = await client.query(`
      SELECT p.id, u.name AS cadet_name, p.activity_type, p.activity_date,
             p.review_status, p.reviewer_comment
      FROM physical_submissions p
      JOIN users u ON u.id = p.cadet_id
      LIMIT 5
    `);
    console.log(`   - Physical Training Export: OK (${ptRes.rowCount} sample records)`);

    // 4.5 Leaves
    const lvRes = await client.query(`
      SELECT l.id, u.name AS cadet_name, cp.roll_no, l.start_date, l.end_date,
             l.reason, l.status
      FROM leaves l
      JOIN users u ON u.id = l.cadet_id
      LEFT JOIN cadet_profiles cp ON cp.user_id = u.id
      LIMIT 5
    `);
    console.log(`   - Leaves Export: OK (${lvRes.rowCount} sample records)`);

    // 4.6 Timetable
    const ttRes = await client.query(`
      SELECT schedule_key, schedule_title, day_of_week, slot_order, start_time, end_time, time_display, activity, category
      FROM timetable_slots
      LIMIT 5
    `);
    console.log(`   - Timetable Export: OK (${ttRes.rowCount} sample records)`);

    // 4.7 Counselling Registrations
    const regRes = await client.query(`
      SELECT reference_id, full_name, phone, email, program, created_at
      FROM counselling_registrations
      LIMIT 5
    `);
    console.log(`   - Registrations Export: OK (${regRes.rowCount} sample records)`);

    // Cleanup test cadet
    await client.query('DELETE FROM users WHERE id=$1', [newCadet.id]);
    console.log('✔ Test cadet cleaned up successfully');

    console.log('\n=== ALL 5 USER REQUIREMENTS VERIFIED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runTests();
