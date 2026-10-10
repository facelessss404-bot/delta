require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const storage = require('../config/supabaseStorage');

async function seedMockData() {
  console.log('🚀 Starting Comprehensive Mock Data Seeding for Delta Squad Foundation...');

  // Remove any legacy automated test placeholder users
  await pool.query("DELETE FROM users WHERE email LIKE '%example.test%' OR email LIKE '%auto_test%'");

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Core Users (The 3 main logins + 4 additional cadets)
  const usersToSeed = [
    { email: 'commander@commander.com', name: 'Training Commander Lt. Esan', role: 'commander' },
    { email: 'admin@admin.com', name: 'Admin Officer Maj. R. K. Nair', role: 'admin' },
    { email: 'cadet@cadet.com', name: 'Cadet Rohan Sharma', role: 'cadet' },
    { email: 'cadet.ananya@delta.com', name: 'Cadet Ananya Verma', role: 'cadet' },
    { email: 'cadet.arjun@delta.com', name: 'Cadet Arjun Nair', role: 'cadet' },
    { email: 'cadet.priya@delta.com', name: 'Cadet Priya Deshmukh', role: 'cadet' },
    { email: 'cadet.vikram@delta.com', name: 'Cadet Vikram Rathore', role: 'cadet' }
  ];

  const userMap = {}; // email -> id

  for (const u of usersToSeed) {
    const res = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password, role = EXCLUDED.role
       RETURNING id, email, role, name`,
      [u.name, u.email, passwordHash, u.role]
    );
    userMap[u.email] = res.rows[0].id;
    console.log(`✓ User synced: ${u.role.toUpperCase()} - ${u.email} (ID: ${res.rows[0].id})`);
  }

  const commanderId = userMap['commander@commander.com'];
  const adminId = userMap['admin@admin.com'];
  const cadetRohanId = userMap['cadet@cadet.com'];
  const cadetAnanyaId = userMap['cadet.ananya@delta.com'];
  const cadetArjunId = userMap['cadet.arjun@delta.com'];
  const cadetPriyaId = userMap['cadet.priya@delta.com'];
  const cadetVikramId = userMap['cadet.vikram@delta.com'];

  // Cadet profiles
  const profiles = [
    { id: cadetRohanId, roll: 'DSF-2025-001', batch: 'Alpha Batch 2025-26', prog: 'NDA Foundation' },
    { id: cadetAnanyaId, roll: 'DSF-2025-002', batch: 'Alpha Batch 2025-26', prog: 'NDA Foundation' },
    { id: cadetArjunId, roll: 'DSF-2025-003', batch: 'Alpha Batch 2025-26', prog: 'CDS / AFCAT Regular' },
    { id: cadetPriyaId, roll: 'DSF-2025-004', batch: 'Bravo Batch 2025-26', prog: 'SSB Intensive' },
    { id: cadetVikramId, roll: 'DSF-2025-005', batch: 'Alpha Batch 2025-26', prog: 'NDA Foundation' },
  ];

  for (const p of profiles) {
    await pool.query(
      `INSERT INTO cadet_profiles (user_id, roll_no, batch, programme, status)
       VALUES ($1, $2, $3, $4, 'active')
       ON CONFLICT (user_id) DO UPDATE SET roll_no = EXCLUDED.roll_no, batch = EXCLUDED.batch, programme = EXCLUDED.programme, status = 'active'`,
      [p.id, p.roll, p.batch, p.prog]
    );
  }
  console.log('✓ Cadet profiles populated.');

  // 2. Subjects catalogue
  const subjectList = [
    { name: 'Mathematics', code: 'MATH-101', cat: 'academic' },
    { name: 'Physics', code: 'PHY-101', cat: 'academic' },
    { name: 'SSB & Personality Development', code: 'SSB-201', cat: 'military' },
    { name: 'General Studies & Defence GK', code: 'GK-101', cat: 'academic' },
    { name: 'Physical Training & Obstacles', code: 'PT-101', cat: 'physical' },
    { name: 'English & Communication', code: 'ENG-101', cat: 'academic' }
  ];

  const subjectMap = {}; // name -> id
  for (const s of subjectList) {
    const res = await pool.query(
      `INSERT INTO subjects (name, code, category, active)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (name) DO UPDATE SET code = EXCLUDED.code, category = EXCLUDED.category, active = true
       RETURNING id, name`,
      [s.name, s.code, s.cat]
    );
    subjectMap[s.name] = res.rows[0].id;
  }
  console.log('✓ Subjects catalogue populated:', Object.keys(subjectMap));

  // 3. Subject assignments for cadets
  const allCadetIds = [cadetRohanId, cadetAnanyaId, cadetArjunId, cadetPriyaId, cadetVikramId];
  for (const cid of allCadetIds) {
    for (const [sname, sid] of Object.entries(subjectMap)) {
      await pool.query(
        `INSERT INTO subject_assignments (cadet_id, subject_id, batch)
         VALUES ($1, $2, 'Alpha Batch 2025-26')
         ON CONFLICT (cadet_id, subject_id) DO NOTHING`,
        [cid, sid]
      );
    }
  }
  console.log('✓ Subject assignments populated.');

  // 4. Multi-week Attendance Sessions & Records
  const sessions = [
    { subj: 'Mathematics', date: '2026-10-01', start: '08:00', end: '09:30', type: 'class', batch: 'Alpha Batch 2025-26' },
    { subj: 'Physical Training & Obstacles', date: '2026-10-02', start: '06:00', end: '07:30', type: 'drill', batch: 'Alpha Batch 2025-26' },
    { subj: 'Physics', date: '2026-10-03', start: '09:45', end: '11:15', type: 'class', batch: 'Alpha Batch 2025-26' },
    { subj: 'SSB & Personality Development', date: '2026-10-04', start: '14:00', end: '16:00', type: 'class', batch: 'Alpha Batch 2025-26' },
    { subj: 'General Studies & Defence GK', date: '2026-10-05', start: '11:30', end: '13:00', type: 'class', batch: 'Alpha Batch 2025-26' },
    { subj: 'Physical Training & Obstacles', date: '2026-10-06', start: '06:00', end: '07:30', type: 'drill', batch: 'Alpha Batch 2025-26' },
    { subj: 'Mathematics', date: '2026-10-07', start: '08:00', end: '09:30', type: 'class', batch: 'Alpha Batch 2025-26' },
    { subj: 'Physics', date: '2026-10-08', start: '09:45', end: '11:15', type: 'class', batch: 'Alpha Batch 2025-26' },
    { subj: 'SSB & Personality Development', date: '2026-10-09', start: '14:00', end: '16:00', type: 'mock_test', batch: 'Alpha Batch 2025-26' },
    { subj: 'English & Communication', date: '2026-10-10', start: '10:00', end: '11:30', type: 'class', batch: 'Alpha Batch 2025-26' },
  ];

  for (let idx = 0; idx < sessions.length; idx++) {
    const sess = sessions[idx];
    const sId = subjectMap[sess.subj];
    if (!sId) continue;

    // Check if session exists or create
    let sessRow = await pool.query(
      `SELECT id FROM attendance_sessions WHERE subject_id=$1 AND session_date=$2 AND session_type=$3`,
      [sId, sess.date, sess.type]
    );

    let sessionId;
    if (sessRow.rows.length) {
      sessionId = sessRow.rows[0].id;
    } else {
      const ins = await pool.query(
        `INSERT INTO attendance_sessions (subject_id, batch, session_date, start_time, end_time, session_type, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [sId, sess.batch, sess.date, sess.start, sess.end, sess.type, adminId]
      );
      sessionId = ins.rows[0].id;
    }

    // Mark records for cadets
    // Rohan: Present on 9 out of 10 sessions (90% attendance)
    // Ananya: Present on 10 out of 10 sessions (100%)
    // Arjun: Present on 8 out of 10 (80%)
    // Vikram: Present on only 6 out of 10 (60% -> triggers low attendance alert < 75%)
    // Priya: Present on 9 out of 10 (90%)
    const attendancePlan = {
      [cadetRohanId]: idx === 3 ? 'absent' : 'present',
      [cadetAnanyaId]: 'present',
      [cadetArjunId]: (idx === 1 || idx === 7) ? 'absent' : 'present',
      [cadetVikramId]: (idx === 1 || idx === 2 || idx === 5 || idx === 8) ? 'absent' : 'present',
      [cadetPriyaId]: idx === 6 ? 'absent' : 'present',
    };

    for (const [cid, status] of Object.entries(attendancePlan)) {
      await pool.query(
        `INSERT INTO attendance_session_records (session_id, cadet_id, status, marked_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (session_id, cadet_id) DO UPDATE SET status = EXCLUDED.status`,
        [sessionId, Number(cid), status, adminId]
      );
    }
  }
  console.log('✓ Attendance sessions & records populated.');

  // 5. Assessments & Assessment Marks
  const assessmentsToSeed = [
    { title: 'NDA Mathematics Mock Test 1', subj: 'Mathematics', type: 'written', date: '2026-10-02', max: 100 },
    { title: 'Physics Mechanics & Optics Test', subj: 'Physics', type: 'written', date: '2026-10-04', max: 50 },
    { title: 'SSB Psychological Battery (TAT/WAT)', subj: 'SSB & Personality Development', type: 'psych', date: '2026-10-06', max: 50 },
    { title: 'General Studies & Defence GK Quiz', subj: 'General Studies & Defence GK', type: 'written', date: '2026-10-08', max: 50 },
    { title: 'Obstacle Course & PT Standard Test', subj: 'Physical Training & Obstacles', type: 'physical', date: '2026-10-09', max: 100 },
  ];

  for (const a of assessmentsToSeed) {
    const sId = subjectMap[a.subj];
    let aRow = await pool.query(
      `SELECT id FROM assessments WHERE title=$1`,
      [a.title]
    );

    let assessmentId;
    if (aRow.rows.length) {
      assessmentId = aRow.rows[0].id;
    } else {
      const ins = await pool.query(
        `INSERT INTO assessments (subject_id, title, assessment_type, assessment_date, max_marks, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [sId, a.title, a.type, a.date, a.max, adminId]
      );
      assessmentId = ins.rows[0].id;
    }

    // Marks for cadets
    const marksData = [
      { cid: cadetRohanId, marks: a.max === 100 ? 88 : 44, remarks: 'Superb analytical accuracy and tactical depth.' },
      { cid: cadetAnanyaId, marks: a.max === 100 ? 94 : 47, remarks: 'Top percentile score. Exceptional conceptual clarity.' },
      { cid: cadetArjunId, marks: a.max === 100 ? 76 : 38, remarks: 'Good grasp of principles, pace needs improvement.' },
      { cid: cadetVikramId, marks: a.max === 100 ? 68 : 34, remarks: 'Adequate, advised extra problem sets.' },
      { cid: cadetPriyaId, marks: a.max === 100 ? 84 : 42, remarks: 'Impressive confidence and logical structuring.' },
    ];

    for (const m of marksData) {
      await pool.query(
        `INSERT INTO assessment_marks (assessment_id, cadet_id, marks, remarks, entered_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (assessment_id, cadet_id) DO UPDATE SET marks = EXCLUDED.marks, remarks = EXCLUDED.remarks`,
        [assessmentId, m.cid, m.marks, m.remarks, adminId]
      );
    }
  }
  console.log('✓ Assessments & Marks populated.');

  // 6. Exams & Results Module
  const examsToSeed = [
    { name: 'Term 1 Comprehensive Assessment', type: 'written', max: 100, date: '2026-10-01', subj: 'Mathematics' },
    { name: 'Mock SSB Interview & Board Conference', type: 'interview', max: 100, date: '2026-10-04', subj: 'SSB & Personality Development' },
    { name: 'GTO Outdoor Progressive Tasks', type: 'gto', max: 100, date: '2026-10-07', subj: 'SSB & Personality Development' },
    { name: 'Psychology Dossier Evaluation', type: 'psych', max: 100, date: '2026-10-09', subj: 'SSB & Personality Development' }
  ];

  for (const ex of examsToSeed) {
    const sId = subjectMap[ex.subj];
    let exRow = await pool.query(`SELECT id FROM exams WHERE name=$1`, [ex.name]);
    let examId;
    if (exRow.rows.length) {
      examId = exRow.rows[0].id;
    } else {
      const ins = await pool.query(
        `INSERT INTO exams (name, exam_type, subject_id, max_marks, exam_date, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [ex.name, ex.type, sId, ex.max, ex.date, commanderId]
      );
      examId = ins.rows[0].id;
    }

    const examResults = [
      { cid: cadetRohanId, marks: 87, remarks: 'Cleared with high OLQ rating. Solid officer disposition.' },
      { cid: cadetAnanyaId, marks: 92, remarks: 'Outstanding presentation, quick situational leadership.' },
      { cid: cadetArjunId, marks: 79, remarks: 'Good physical presence, needs to articulate answers crisply.' },
      { cid: cadetVikramId, marks: 73, remarks: 'Average response under stress, group cooperation commended.' },
      { cid: cadetPriyaId, marks: 85, remarks: 'Command task handled with composure and logical delegation.' }
    ];

    for (const r of examResults) {
      await pool.query(
        `INSERT INTO results (exam_id, cadet_id, marks_obtained, remarks, graded_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (exam_id, cadet_id) DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained, remarks = EXCLUDED.remarks`,
        [examId, r.cid, r.marks, r.remarks, commanderId]
      );
    }
  }
  console.log('✓ Exams & Results module populated.');

  // 7. Supabase Storage - Physical Video and Training Notes Files
  console.log('Uploading sample physical training video to Supabase Storage...');
  const sampleVideoPath = path.join(__dirname, '../../Logo_animation_for_webpage_202605030042.mp4');
  let videoBuffer;
  if (fs.existsSync(sampleVideoPath)) {
    videoBuffer = fs.readFileSync(sampleVideoPath);
  } else {
    videoBuffer = Buffer.from('mock video binary content');
  }

  const rohanStorageKey = `cadets/${cadetRohanId}/drill-5km-endurance.mp4`;
  const rohanStorageKey2 = `cadets/${cadetRohanId}/chinups-strict-20reps.mp4`;
  const rohanStorageKey3 = `cadets/${cadetRohanId}/obstacle-course-tarzan.mp4`;
  const ananyaStorageKey = `cadets/${cadetAnanyaId}/100m-sprint-shuttle.mp4`;

  try {
    await storage.uploadBuffer({
      bucket: 'physical-videos',
      key: rohanStorageKey,
      buffer: videoBuffer,
      contentType: 'video/mp4'
    });
    await storage.uploadBuffer({
      bucket: 'physical-videos',
      key: rohanStorageKey2,
      buffer: videoBuffer,
      contentType: 'video/mp4'
    });
    await storage.uploadBuffer({
      bucket: 'physical-videos',
      key: rohanStorageKey3,
      buffer: videoBuffer,
      contentType: 'video/mp4'
    });
    await storage.uploadBuffer({
      bucket: 'physical-videos',
      key: ananyaStorageKey,
      buffer: videoBuffer,
      contentType: 'video/mp4'
    });
    console.log('✓ Physical training video files stored in Supabase.');
  } catch (err) {
    console.warn('Note on storage upload:', err.message);
  }

  // Physical submissions table
  const physicalSubs = [
    {
      cid: cadetRohanId,
      activity: '5km Cross-Country Endurance Run',
      date: '2026-10-03',
      key: rohanStorageKey,
      filename: '5km-endurance-run.mp4',
      size: videoBuffer.length,
      review: 'accepted',
      revBy: commanderId,
      comment: 'Official timing: 21m 45s. Exemplary aerobic pacing and form.'
    },
    {
      cid: cadetRohanId,
      activity: 'Strict Chin-ups & Core Drill (20 reps)',
      date: '2026-10-06',
      key: rohanStorageKey2,
      filename: 'chinups-20reps.mp4',
      size: videoBuffer.length,
      review: 'accepted',
      revBy: adminId,
      comment: 'Full extension on all 20 repetitions. Defence fitness standard met.'
    },
    {
      cid: cadetRohanId,
      activity: 'Obstacle Course - Tarzan Swing & Commando Net',
      date: '2026-10-09',
      key: rohanStorageKey3,
      filename: 'obstacle-tarzan-swing.mp4',
      size: videoBuffer.length,
      review: 'pending', // PENDING for Staff to review!
      revBy: null,
      comment: null
    },
    {
      cid: cadetAnanyaId,
      activity: '100m Sprint & Shuttle Run Assessment',
      date: '2026-10-08',
      key: ananyaStorageKey,
      filename: 'sprint-shuttle-100m.mp4',
      size: videoBuffer.length,
      review: 'pending', // PENDING for Staff to review!
      revBy: null,
      comment: null
    }
  ];

  for (const ps of physicalSubs) {
    await pool.query(
      `INSERT INTO physical_submissions (
         cadet_id, activity_type, activity_date, storage_key, filename, mime_type, file_size, upload_status, review_status, reviewed_by, reviewed_at, reviewer_comment
       )
       VALUES ($1, $2, $3, $4, $5, 'video/mp4', $6, 'uploaded', $7, $8, ${ps.review === 'accepted' ? 'CURRENT_TIMESTAMP' : 'NULL'}, $9)
       ON CONFLICT (storage_key) DO UPDATE SET review_status = EXCLUDED.review_status, reviewer_comment = EXCLUDED.reviewer_comment`,
      [ps.cid, ps.activity, ps.date, ps.key, ps.filename, ps.size, ps.review, ps.revBy, ps.comment]
    );
  }
  console.log('✓ Physical submissions populated.');

  // 8. Training Notes / Course Material
  const sampleNoteBuffer = Buffer.from(
    `# DELTA SQUAD FOUNDATION - TRAINING MANUAL\n\n` +
    `Officers Preparing Academy, Coimbatore\n` +
    `Led by Lt. Esan | Building Next-Gen Commissioned Officers\n\n` +
    `This training manual outlines fundamental officer-like qualities (OLQ), ` +
    `speed-solving mathematics strategies, and daily physical readiness drills.`
  );

  const notesToSeed = [
    {
      title: 'SSB Stage 1 Screening & OIR Practice Guide',
      desc: 'Complete compilation of Verbal and Non-Verbal Officer Intelligence Rating tests with solved mock tests and PPDT guidelines.',
      subj: 'SSB & Personality Development',
      key: `notes/${commanderId}/ssb-stage1-oir-guide.pdf`,
      filename: 'ssb-stage1-oir-guide.pdf'
    },
    {
      title: 'Physics - Mechanics & Kinematics Formula Book',
      desc: 'Formulas, derivations, and quick problem-solving techniques for NDA and technical branch examinations.',
      subj: 'Physics',
      key: `notes/${adminId}/physics-mechanics-formula-book.pdf`,
      filename: 'physics-mechanics-formula-book.pdf'
    },
    {
      title: 'Mathematics - Calculus & Vectors Quick Revision',
      desc: 'High-yield formulas, shortcut tricks, and solved previous years questions for NDA / CDS math.',
      subj: 'Mathematics',
      key: `notes/${adminId}/maths-calculus-vectors-revision.pdf`,
      filename: 'maths-calculus-vectors-revision.pdf'
    },
    {
      title: 'Current Affairs & Strategic Defence GK Compendium 2025',
      desc: 'Comprehensive monthly digest covering international relations, armed forces modernization, and major joint exercises.',
      subj: 'General Studies & Defence GK',
      key: `notes/${commanderId}/defence-gk-compendium-2025.pdf`,
      filename: 'defence-gk-compendium-2025.pdf'
    }
  ];

  for (const n of notesToSeed) {
    try {
      await storage.uploadBuffer({
        bucket: 'training-notes',
        key: n.key,
        buffer: sampleNoteBuffer,
        contentType: 'application/pdf'
      });
    } catch (err) {
      console.warn('Note storage upload warning:', err.message);
    }

    const sId = subjectMap[n.subj];
    await pool.query(
      `INSERT INTO notes (title, description, subject_id, file_path, file_size, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, 'application/pdf', $6)
       ON CONFLICT DO NOTHING`,
      [n.title, n.desc, sId, n.key, sampleNoteBuffer.length, commanderId]
    );
  }
  console.log('✓ Training Notes populated.');

  // 9. Notice Board
  const noticesToSeed = [
    {
      title: 'Mandatory Briefing: Upcoming State Level Obstacle & Drill Assessment',
      content: 'All cadets of Alpha and Bravo batches are instructed to muster at Parade Ground 1 tomorrow at 0630 hours sharp in full PT rig. Attendance is strictly compulsory. The Training Commander will conduct the pre-exercise briefing.',
      priority: 'urgent',
      by: commanderId
    },
    {
      title: 'SSB Mock Interview & Board Conference Schedule - Batch Alpha',
      content: 'Individual mock interview slots for Batch Alpha have been allocated on the notice portal. Cadets must report to the Officer Mess Conference Room 15 minutes prior to their assigned slot in formal uniform with completed PIQ forms.',
      priority: 'high',
      by: commanderId
    },
    {
      title: 'NDA & CDS Study Materials and Practice Papers Uploaded',
      content: 'New revision notes on Calculus, Modern Military History, and NDA Mathematics practice sets have been uploaded to the Training Notes repository. Cadets can download them directly from their student dashboard.',
      priority: 'normal',
      by: adminId
    },
    {
      title: 'Physical Fitness Conditioning & Nutrition Advisory',
      content: 'With cross-country trials scheduled next week, hydration guidelines and pre-drill dietary recommendations from the medical staff are now active. Electrolytes will be provided at all water points.',
      priority: 'normal',
      by: adminId
    },
    {
      title: 'Central Library Extended Reading & SSB Discussion Hours',
      content: 'The Delta Squad reference library and digital study room will remain open until 2230 hours daily for evening self-study and SSB group discussion practice.',
      priority: 'low',
      by: commanderId
    }
  ];

  for (const nt of noticesToSeed) {
    await pool.query(
      `INSERT INTO notices (title, content, priority, posted_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [nt.title, nt.content, nt.priority, nt.by]
    );
  }
  console.log('✓ Notice Board populated.');

  // 10. Leaves Management
  const leavesToSeed = [
    {
      cid: cadetRohanId,
      start: '2026-10-15',
      end: '2026-10-17',
      reason: "Attending elder sister's wedding ceremony in Coimbatore. Formal family invitation submitted.",
      status: 'approved',
      by: commanderId,
      remarks: 'Privilege leave granted for 3 days. Cadet to report back to academy duty by 18th Oct 0600 hrs.'
    },
    {
      cid: cadetRohanId,
      start: '2026-10-12',
      end: '2026-10-13',
      reason: 'Specialist medical consultation at Military Hospital for minor ankle strain sustained during obstacle drill.',
      status: 'pending', // PENDING for Staff to approve/reject live in demo!
      by: null,
      remarks: null
    },
    {
      cid: cadetRohanId,
      start: '2026-10-04',
      end: '2026-10-05',
      reason: 'Personal weekend outing for family shopping during scheduled tactical exercise.',
      status: 'rejected',
      by: adminId,
      remarks: 'Leave denied due to mandatory attendance required for tactical troop exercise.'
    },
    {
      cid: cadetAnanyaId,
      start: '2026-10-20',
      end: '2026-10-22',
      reason: 'University practical examinations attendance at home college.',
      status: 'approved',
      by: commanderId,
      remarks: 'Approved upon verification of examination hall ticket.'
    }
  ];

  for (const lv of leavesToSeed) {
    await pool.query(
      `INSERT INTO leaves (cadet_id, start_date, end_date, reason, status, reviewed_by, reviewer_remarks, reviewed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, ${lv.status !== 'pending' ? 'CURRENT_TIMESTAMP' : 'NULL'})`,
      [lv.cid, lv.start, lv.end, lv.reason, lv.status, lv.by, lv.remarks]
    );
  }
  console.log('✓ Leaves populated.');

  // 11. Notifications
  const notifs = [
    { uid: cadetRohanId, title: 'Leave Request Approved', msg: "Your leave request for 15 Oct - 17 Oct has been approved by Training Commander Lt. Esan.", type: 'leave' },
    { uid: cadetRohanId, title: 'New Assessment Result', msg: 'Marks for NDA Mathematics Mock Test 1 published. Your score: 88/100.', type: 'academic' },
    { uid: cadetRohanId, title: 'Physical Submission Verified', msg: 'Your 5km Cross-Country Endurance Run submission has been accepted.', type: 'physical' },
    { uid: cadetRohanId, title: 'Urgent Academy Notice', msg: 'Briefing on Upcoming State Level Obstacle & Drill Assessment scheduled tomorrow at 0630 hrs.', type: 'notice' },
    { uid: commanderId, title: 'Pending Physical Submission', msg: 'Cadet Rohan Sharma has submitted "Obstacle Course - Tarzan Swing" awaiting review.', type: 'physical' },
    { uid: commanderId, title: 'New Leave Request', msg: 'Cadet Rohan Sharma submitted a leave request for Medical consultation.', type: 'leave' },
    { uid: adminId, title: 'Pending Physical Submission', msg: 'Cadet Ananya Verma submitted "100m Sprint & Shuttle Run" awaiting review.', type: 'physical' }
  ];

  for (const nf of notifs) {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [nf.uid, nf.title, nf.msg, nf.type]
    );
  }
  console.log('✓ Notifications populated.');

  // 12. Audit Logs
  const auditLogs = [
    { actor: commanderId, action: 'notice.published', type: 'notice', id: '1', desc: 'Published urgent notice: Obstacle & Drill Assessment' },
    { actor: adminId, action: 'attendance_session.created', type: 'attendance_session', id: '1', desc: 'Conducted Mathematics morning session' },
    { actor: commanderId, action: 'leave.approved', type: 'leave', id: '1', desc: 'Approved privilege leave for Cadet Rohan Sharma' },
    { actor: adminId, action: 'assessment.marks_entered', type: 'assessment', id: '1', desc: 'Entered marks for NDA Mathematics Mock Test 1' },
    { actor: commanderId, action: 'physical_submission.reviewed', type: 'physical_submission', id: '1', desc: 'Accepted 5km Cross-Country submission' }
  ];

  for (const al of auditLogs) {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, after_data)
       VALUES ($1, $2, $3, $4, $5)`,
      [al.actor, al.action, al.type, al.id, JSON.stringify({ summary: al.desc })]
    );
  }
  console.log('✓ Audit logs populated.');

  // 13. Counselling Registrations
  const counsellingRegs = [
    {
      name: 'Karthik Subramanian',
      phone: '+91 98452 11234',
      email: 'karthik.subbu@gmail.com',
      age: '17',
      edu: '12th Standard PCM',
      prog: 'nda',
      mode: 'phone',
      notes: 'Targeting NDA 154 course entry. Inquiring about residential training facilities.',
      ref: 'DSF-2025-REG-101'
    },
    {
      name: 'Sneha Patel',
      phone: '+91 97234 55678',
      email: 'sneha.p@outlook.com',
      age: '21',
      edu: 'B.Tech Final Year (CSE)',
      prog: 'afcat',
      mode: 'in_person',
      notes: 'Cleared AFCAT written; seeking specialized SSB interview & psychological prep.',
      ref: 'DSF-2025-REG-102'
    },
    {
      name: 'Aditya Rawat',
      phone: '+91 96123 44556',
      email: 'aditya.rawat@yahoo.com',
      age: '19',
      edu: 'B.Sc Physics 1st Year',
      prog: 'cds',
      mode: 'phone',
      notes: 'Father retired Subedar. Keen on joining officer preparatory academy.',
      ref: 'DSF-2025-REG-103'
    },
    {
      name: 'Divya Krishnan',
      phone: '+91 99876 12345',
      email: 'divya.k@gmail.com',
      age: '18',
      edu: '12th Standard Passed (92%)',
      prog: 'ssb',
      mode: 'in_person',
      notes: 'Applying for 100% Scholarship Scheme with high merit standing.',
      ref: 'DSF-2025-REG-104'
    }
  ];

  for (const cr of counsellingRegs) {
    await pool.query(
      `INSERT INTO counselling_registrations (
         full_name, phone, email, dob_or_age, education_level, program, mode, additional_notes, consent, reference_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
       ON CONFLICT (reference_id) DO NOTHING`,
      [cr.name, cr.phone, cr.email, cr.age, cr.edu, cr.prog, cr.mode, cr.notes, cr.ref]
    );
  }
  console.log('✓ Counselling registrations populated.');

  // 14. User settings
  for (const uid of Object.values(userMap)) {
    await pool.query(
      `INSERT INTO user_settings (user_id, language, email_notifications)
       VALUES ($1, 'en', true)
       ON CONFLICT (user_id) DO UPDATE SET email_notifications = true`,
      [uid]
    );
  }
  console.log('✓ User settings populated.');

  console.log('\n🎉 ALL MOCK DATA SEEDED SUCCESSFULLY!');
  console.log('=============================================');
  console.log('3 LOGIN CREDENTIALS READY FOR CLIENT DEMO:');
  console.log('1. Training Commander: commander@commander.com / password123');
  console.log('2. Admin Officer:      admin@admin.com / password123');
  console.log('3. Cadet:              cadet@cadet.com / password123');
  console.log('=============================================');
}

seedMockData()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
