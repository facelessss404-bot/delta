require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });
const app = require('../backend/server');
const pool = require('../backend/config/db');

async function runVerification() {
  console.log('--- Starting Delta Squad Timetable & Leave Integration E2E Verification ---');
  const server = await app.listen(5097);
  const baseUrl = 'http://localhost:5097/api';

  try {
    // 1. Cadet Login & Timetable verification
    console.log('\n1. Testing Cadet Login & Portal Timetable...');
    const cadetLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cadet@cadet.com', password: 'password123' })
    });
    if (!cadetLoginRes.ok) {
      // try alternate known password
      const alt = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'cadet@cadet.com', password: 'cadet123' })
      });
      if (!alt.ok) throw new Error('Cadet login failed');
    }
    const cadetAuth = await (cadetLoginRes.ok ? cadetLoginRes : null)?.json();
    const cadetToken = cadetAuth?.token || (await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cadet@cadet.com', password: 'password123' })
    }).then(r => r.json())).token;

    const myTimetableRes = await fetch(`${baseUrl}/timetable/my`, {
      headers: { Authorization: `Bearer ${cadetToken}` }
    });
    const myTimetable = await myTimetableRes.json();
    console.log('   Cadet Programme:', myTimetable.cadet?.programme);
    console.log('   Assigned Schedule:', myTimetable.schedule?.title);
    console.log('   Total Preset Slots:', myTimetable.slots?.length);
    if (!myTimetable.slots || myTimetable.slots.length < 100) {
      throw new Error(`Expected at least 114 slots for cadet schedule, got ${myTimetable.slots?.length}`);
    }
    console.log('   Sample Slot 1:', myTimetable.slots[0].activity, `(${myTimetable.slots[0].time_display})`);
    console.log('   Sample Slot 6 (Period 1):', myTimetable.slots[5].activity, `[Instructor: ${myTimetable.slots[5].instructor}]`);

    // 2. Commander Login & All 3 Schedules Preset verification
    console.log('\n2. Testing Commander Portal & Preset Schedules...');
    const cmdLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'onlyesan@gmail.com', password: 'ESAN@DELTA' })
    });
    const cmdToken = (await cmdLoginRes.json()).token;

    const schedulesRes = await fetch(`${baseUrl}/timetable/schedules`, {
      headers: { Authorization: `Bearer ${cmdToken}` }
    });
    const schedules = await schedulesRes.json();
    console.log('   Schedules count:', schedules.length);
    for (const s of schedules) {
      console.log(`     - ${s.title} (${s.key}): ${s.slotCount} slots preset`);
    }

    // Verify Grade 8-10, 11-12, NDA are all preset with 114 slots each
    if (schedules.length !== 3) throw new Error('Expected 3 timetable schedules');
    for (const s of schedules) {
      if (s.slotCount !== 114) throw new Error(`Schedule ${s.key} has ${s.slotCount} slots, expected 114`);
    }

    // 3. Attendance Roster & Approved Leave Synchronization verification
    console.log('\n3. Testing Attendance Roster with Approved Full-Day Leave...');
    // Date: 2026-10-15 (Cadet Rohan Sharma id: 3 has approved leave 2026-10-14 to 2026-10-16)
    const rosterRes = await fetch(`${baseUrl}/attendance/cadets?subjectId=3&batch=Alpha%20Batch%202025-26&date=2026-10-15`, {
      headers: { Authorization: `Bearer ${cmdToken}` }
    });
    const roster = await rosterRes.json();
    console.log(`   Found ${roster.length} cadets in Alpha Batch for date 2026-10-15`);
    const rohan = roster.find(c => c.name.includes('Rohan'));
    if (!rohan) throw new Error('Cadet Rohan Sharma not found in roster');
    console.log('   Cadet Rohan Sharma is_on_leave:', rohan.is_on_leave);
    console.log('   Leave reason:', rohan.active_leave?.reason);
    if (!rohan.is_on_leave) {
      throw new Error('Expected Cadet Rohan Sharma to be detected as On Leave on 2026-10-15');
    }

    // Create session for 2026-10-15 and record attendance with 'leave' status
    console.log('\n4. Testing Session Creation & Bulk Attendance Save with "leave" status...');
    const sessionRes = await fetch(`${baseUrl}/attendance/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cmdToken}`
      },
      body: JSON.stringify({
        subjectId: 3,
        batch: 'Alpha Batch 2025-26',
        date: '2026-10-15',
        startTime: '09:00',
        endTime: '10:00',
        sessionType: 'class'
      })
    });
    const sessionData = await sessionRes.json();
    console.log('   Session created:', sessionData.id);

    const saveRes = await fetch(`${baseUrl}/attendance/records/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cmdToken}`
      },
      body: JSON.stringify({
        sessionId: sessionData.id,
        records: roster.map(c => ({
          cadetId: c.id,
          status: c.is_on_leave ? 'leave' : 'present'
        }))
      })
    });
    const saveResult = await saveRes.json();
    console.log('   Bulk save response:', saveResult.message);
    if (!saveRes.ok) throw new Error(`Bulk save failed: ${JSON.stringify(saveResult)}`);

    // Verify records saved
    const savedRecordsRes = await fetch(`${baseUrl}/attendance/sessions/${sessionData.id}/records`, {
      headers: { Authorization: `Bearer ${cmdToken}` }
    });
    const savedRecords = await savedRecordsRes.json();
    const rohanSaved = savedRecords.find(r => r.cadet_id === rohan.id);
    console.log('   Cadet Rohan saved status:', rohanSaved?.status, '(expected: leave)');
    if (rohanSaved?.status !== 'leave') throw new Error(`Expected status 'leave', got '${rohanSaved?.status}'`);

    // 5. Admin Direct Leave Grant test
    console.log('\n5. Testing Admin Direct Leave Grant (Full-Day Excused)...');
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@admin.com', password: 'password123' })
    });
    const adminToken = (await adminLoginRes.json()).token;

    // Grant direct leave for Cadet 17 on 2026-10-28
    const directLeaveRes = await fetch(`${baseUrl}/leaves`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        cadet_id: 17,
        start_date: '2026-10-28',
        end_date: '2026-10-28',
        reason: 'National Youth Leadership Seminar deputation',
        reviewer_remarks: 'Command authorized absence'
      })
    });
    const directLeave = await directLeaveRes.json();
    console.log('   Direct leave granted: id =', directLeave.id, 'status =', directLeave.status);
    if (directLeave.status !== 'approved') throw new Error(`Expected direct leave status 'approved', got '${directLeave.status}'`);

    // Check roster for 2026-10-28
    const roster28Res = await fetch(`${baseUrl}/attendance/cadets?subjectId=3&batch=Alpha%20Batch%202025-26&date=2026-10-28`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const roster28 = await roster28Res.json();
    const cadet17 = roster28.find(c => c.id === 17);
    console.log('   Cadet 17 is_on_leave on 2026-10-28:', cadet17?.is_on_leave);
    if (!cadet17?.is_on_leave) throw new Error('Expected Cadet 17 to be detected as on approved leave on 2026-10-28');

    console.log('\n>>> ALL 5 END-TO-END VERIFICATION CHECKS PASSED PERFECTLY! <<<');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\nVerification failed:', err);
    server.close();
    process.exit(1);
  }
}

runVerification();
