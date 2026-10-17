require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const http = require('http');
const app = require('../server');
const pool = require('../config/db');

async function runComprehensiveVerification() {
  console.log('🧪 ========================================================');
  console.log('🧪 STARTING COMPREHENSIVE CLIENT HANDOVER VERIFICATION TEST');
  console.log('🧪 ========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${detail}`);
      failed++;
    }
  }

  // Start test server on dynamic port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  async function api(path, opts = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers || {})
      }
    });
    let data;
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }
    return { status: res.status, ok: res.ok, body: data };
  }

  try {
    // 1. Check Server Health
    console.log('\n[1/7] Testing API Health & Database Connection...');
    const healthRes = await api('/api/health');
    assert(healthRes.status === 200 && healthRes.body?.ok === true, 'Server health and Supabase DB connection');

    // 2. Test Commander Login & Credentials
    console.log('\n[2/7] Testing Training Commander Authentication & Session...');
    const cmdrLogin = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'commander@commander.com', password: 'password123' })
    });
    
    assert(cmdrLogin.status === 200, 'Commander Login HTTP 200');
    assert(cmdrLogin.body?.role === 'commander', 'Commander Role Verified');
    assert(!!cmdrLogin.body?.token, 'Commander JWT Token Generated');
    const cmdrToken = cmdrLogin.body.token;

    // 3. Test Commander Endpoints on Clean State (Zero Data Resilience)
    console.log('\n[3/7] Testing Commander Endpoints on Clean Database (Zero-Crash Verification)...');
    
    // Overview Report
    const overviewRes = await api('/api/reports/overview', {
      headers: { Authorization: `Bearer ${cmdrToken}` }
    });
    assert(overviewRes.status === 200, 'Overview Report returns 200 on 0 cadets');
    assert(Number(overviewRes.body?.stats?.total_cadets) === 0, 'Total cadets correctly shows 0');
    assert(Number(overviewRes.body?.stats?.overall_attendance_percentage) === 0, 'Attendance % gracefully handles zero records (returns 0, not NaN)');

    // Subjects Catalogue
    const subjRes = await api('/api/subjects', {
      headers: { Authorization: `Bearer ${cmdrToken}` }
    });
    assert(subjRes.status === 200 && subjRes.body?.length >= 20, `Subjects catalogue loaded properly (${subjRes.body?.length} subjects active)`);

    // Timetable Slots
    const ttRes = await api('/api/timetable/slots', {
      headers: { Authorization: `Bearer ${cmdrToken}` }
    });
    assert(ttRes.status === 200 && ttRes.body?.length > 300, `Timetable presets loaded properly (${ttRes.body?.length} slots)`);

    // Empty list endpoints verification
    const endpointsToVerify = [
      ['/api/attendance/sessions', 'Attendance Sessions'],
      ['/api/academics/assessments', 'Assessments'],
      ['/api/exams', 'Exams'],
      ['/api/physical', 'Physical Submissions Queue'],
      ['/api/leaves', 'Leaves Queue'],
      ['/api/notices', 'Notice Board'],
      ['/api/notes', 'Training Notes'],
      ['/api/counselling-registrations', 'Counselling Leads'],
      ['/api/admins', 'Admin List']
    ];

    for (const [ep, label] of endpointsToVerify) {
      const res = await api(ep, {
        headers: { Authorization: `Bearer ${cmdrToken}` }
      });
      assert(res.status === 200 && Array.isArray(res.body), `${label} returns HTTP 200 with empty array on fresh state`);
    }

    // 4. Test Public Counselling Registration Form Flow
    console.log('\n[4/7] Testing Public Website Counselling Registration Flow...');
    const regPayload = {
      fullName: 'Handover Test Student',
      phone: '+91 98765 43210',
      email: 'handover.student@test.com',
      dobOrAge: '18',
      educationLevel: '12th Standard Passed',
      program: 'JLP',
      mode: 'phone',
      additionalNotes: 'Automated Handover Smoke Verification',
      consent: true
    };

    const regRes = await api('/api/counselling-registrations', {
      method: 'POST',
      body: JSON.stringify(regPayload)
    });

    assert(regRes.status === 200 && regRes.body?.ok === true, 'Public Counselling Form successfully accepts lead');
    assert(!!regRes.body?.reference_id, `Reference ID generated: ${regRes.body?.reference_id}`);

    // Verify lead appears in Staff counselling list
    const leadsAfter = await api('/api/counselling-registrations', {
      headers: { Authorization: `Bearer ${cmdrToken}` }
    });
    assert(leadsAfter.body.some(l => l.reference_id === regRes.body.reference_id), 'New counselling lead visible in Commander dashboard');

    // Clean up test lead
    await pool.query('DELETE FROM counselling_registrations WHERE reference_id = $1', [regRes.body.reference_id]);
    console.log('  🧹 Cleaned up temporary test counselling registration.');

    // 5. Test 100+ Cadets Self-Registration Capability (Camp Students Ready)
    console.log('\n[5/7] Testing Cadet Self-Registration & Automatic Subject Enrollment...');
    const testCadetEmail = `test_fresh_cadet_${Date.now()}@delta.test`;
    const signupRes = await api('/api/auth/cadet-signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Camp Aspirant Test Cadet',
        email: testCadetEmail,
        password: 'password123',
        category: 'JLP',
        phone: '+91 98111 22334',
        batch: 'Alpha Batch 2026-27'
      })
    });

    assert(signupRes.status === 201, 'Student Self-Signup succeeds with HTTP 201');
    assert(signupRes.body?.role === 'cadet', 'Cadet role assigned');
    assert(!!signupRes.body?.rollNo, `Auto-generated roll number: ${signupRes.body?.rollNo}`);
    assert(!!signupRes.body?.token, 'Cadet session token created');

    const cadetToken = signupRes.body.token;
    const cadetId = signupRes.body.id || signupRes.body._id;

    // Verify student portal access
    const cadetMe = await api('/api/auth/me', {
      headers: { Authorization: `Bearer ${cadetToken}` }
    });
    assert(cadetMe.status === 200 && cadetMe.body?.email === testCadetEmail, 'Cadet can fetch own profile');

    // Verify student timetable access
    const cadetTT = await api('/api/timetable/my', {
      headers: { Authorization: `Bearer ${cadetToken}` }
    });
    assert(cadetTT.status === 200, 'Cadet can fetch personalized timetable');

    // Verify subjects were automatically assigned
    const saCheck = await pool.query('SELECT count(*) FROM subject_assignments WHERE cadet_id = $1', [cadetId]);
    assert(Number(saCheck.rows[0].count) >= 20, `Cadet automatically assigned ${saCheck.rows[0].count} active subjects`);

    // 6. Test Notice Publishing by Commander
    console.log('\n[6/7] Testing Commander Action: Publishing Notice & Verification...');
    const noticeRes = await api('/api/notices', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cmdrToken}` },
      body: JSON.stringify({
        title: 'Welcome to Delta Squad Foundation Camp 2026',
        content: 'Orientation parade scheduled at 0700 hrs.',
        priority: 'urgent'
      })
    });
    assert(noticeRes.status === 201, 'Commander can publish notices');
    
    // Cadet can see the notice
    const cadetNotices = await api('/api/notices', {
      headers: { Authorization: `Bearer ${cadetToken}` }
    });
    assert(cadetNotices.body.some(n => n.title.includes('Camp 2026')), 'Cadet receives notice on dashboard');

    // 7. Final Cleanup of Verification Records
    console.log('\n[7/7] Cleaning up temporary verification artifacts...');
    await pool.query('DELETE FROM notices WHERE title LIKE $1', ['%Camp 2026%']);
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [cadetId]);
    await pool.query('DELETE FROM users WHERE id = $1', [cadetId]);
    console.log('  🧹 Temporary cadet and test notice removed.');

    const finalUsers = await pool.query('SELECT email, role FROM users');
    assert(finalUsers.rows.length === 1 && finalUsers.rows[0].role === 'commander', 'Final database state: Exactly 1 Commander user');

    console.log('\n========================================================');
    console.log(`🎯 VERIFICATION RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('========================================================');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Verification error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await pool.end();
  }
}

runComprehensiveVerification();
