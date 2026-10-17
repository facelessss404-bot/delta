require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../config/db');

async function clearDummyData() {
  console.log('🧹 Starting cleanup of dummy and test data for Client Handover...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Delete test operational activity
    console.log('Clearing counselling registrations...');
    const cr = await client.query('DELETE FROM counselling_registrations');
    console.log(`✓ Removed ${cr.rowCount} counselling registrations.`);

    console.log('Clearing physical training submissions...');
    const ps = await client.query('DELETE FROM physical_submissions');
    console.log(`✓ Removed ${ps.rowCount} physical submissions.`);

    console.log('Clearing leaves...');
    const lv = await client.query('DELETE FROM leaves');
    console.log(`✓ Removed ${lv.rowCount} leaves.`);

    console.log('Clearing attendance records & sessions...');
    const asr = await client.query('DELETE FROM attendance_session_records');
    const as = await client.query('DELETE FROM attendance_sessions');
    const att = await client.query('DELETE FROM attendance');
    console.log(`✓ Removed ${asr.rowCount} session records, ${as.rowCount} sessions, ${att.rowCount} legacy attendance.`);

    console.log('Clearing assessment marks & assessments...');
    const am = await client.query('DELETE FROM assessment_marks');
    const asm = await client.query('DELETE FROM assessments');
    console.log(`✓ Removed ${am.rowCount} assessment marks, ${asm.rowCount} assessments.`);

    console.log('Clearing results & exams...');
    const res = await client.query('DELETE FROM results');
    const ex = await client.query('DELETE FROM exams');
    console.log(`✓ Removed ${res.rowCount} results, ${ex.rowCount} exams.`);

    console.log('Clearing notices and notes...');
    const ntc = await client.query('DELETE FROM notices');
    const nts = await client.query('DELETE FROM notes');
    console.log(`✓ Removed ${ntc.rowCount} notices, ${nts.rowCount} notes.`);

    console.log('Clearing notifications, audit logs, and tokens...');
    const notif = await client.query('DELETE FROM notifications');
    const audit = await client.query('DELETE FROM audit_logs');
    const tokens = await client.query('DELETE FROM password_reset_tokens');
    console.log(`✓ Removed ${notif.rowCount} notifications, ${audit.rowCount} audit logs, ${tokens.rowCount} reset tokens.`);

    console.log('Clearing cadet profiles and subject assignments...');
    const cp = await client.query('DELETE FROM cadet_profiles');
    const sa = await client.query('DELETE FROM subject_assignments');
    console.log(`✓ Removed ${cp.rowCount} cadet profiles, ${sa.rowCount} subject assignments.`);

    // 2. Remove non-commander users (dummy cadets and test admins)
    console.log('Removing dummy cadets and test users (keeping Commander only)...');
    const nonCmdr = await client.query("DELETE FROM users WHERE role != 'commander'");
    console.log(`✓ Removed ${nonCmdr.rowCount} dummy users.`);

    // 3. Clean user settings for removed users
    await client.query("DELETE FROM user_settings WHERE user_id NOT IN (SELECT id FROM users)");

    // 4. Ensure Commander settings exist and are clean
    const cmdr = await client.query("SELECT id, name, email FROM users WHERE role = 'commander' LIMIT 1");
    if (cmdr.rows.length) {
      await client.query(
        `INSERT INTO user_settings (user_id, language, email_notifications)
         VALUES ($1, 'en', true)
         ON CONFLICT (user_id) DO UPDATE SET language = 'en', email_notifications = true`,
        [cmdr.rows[0].id]
      );
      console.log(`✓ Commander account verified: ${cmdr.rows[0].email} (${cmdr.rows[0].name})`);
    }

    await client.query('COMMIT');
    console.log('\n✨ ALL DUMMY AND TEST DATA SUCCESSFULLY CLEARED!');
    console.log('========================================================');
    console.log('The system is in a clean, fresh state ready for client handover.');
    console.log('Commander login is preserved: commander@commander.com / password123');
    console.log('Subjects and Timetable curriculum slots are preserved.');
    console.log('========================================================');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Cleanup failed, rolled back:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

clearDummyData().catch(() => process.exit(1));
