require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function seed() {
  const dataPath = path.join(__dirname, '..', '..', 'timetable_data.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error('timetable_data.json not found');
  }

  const rawSlots = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`Loading ${rawSlots.length} timetable slots...`);

  // Fetch subjects to map IDs
  const subjectsRes = await pool.query('SELECT id, name FROM subjects');
  const subjects = subjectsRes.rows;
  console.log(`Found ${subjects.length} subjects in database`);

  const findSubjectId = (activity) => {
    if (!activity) return null;
    const act = activity.toUpperCase();
    if (act.includes('PHYSICAL') || act.includes('PHSICAL') || act.includes('PT')) {
      const match = subjects.find(s => s.name.toLowerCase().includes('physical'));
      return match ? match.id : null;
    }
    if (act.includes('MATH')) {
      const match = subjects.find(s => s.name.toLowerCase().includes('math'));
      return match ? match.id : null;
    }
    if (act.includes('ENG')) {
      const match = subjects.find(s => s.name.toLowerCase().includes('english'));
      return match ? match.id : null;
    }
    if (act.includes('PHY') && !act.includes('PHYSICAL')) {
      const match = subjects.find(s => s.name.toLowerCase().includes('physics') || s.name === 'Physics');
      return match ? match.id : null;
    }
    if (act.includes('CHE')) {
      const match = subjects.find(s => s.name.toLowerCase().includes('chem'));
      return match ? match.id : null;
    }
    if (act.includes('SCIENCE')) {
      const match = subjects.find(s => s.name.toLowerCase() === 'science');
      return match ? match.id : null;
    }
    if (act.includes('SST')) {
      const match = subjects.find(s => s.name.toLowerCase().includes('social') || s.name.toLowerCase().includes('sst'));
      return match ? match.id : null;
    }
    if (act.includes('B COM') || act.includes('B.COM') || act.includes('COMMERCE')) {
      const match = subjects.find(s => s.name.toLowerCase().includes('commerce'));
      return match ? match.id : null;
    }
    if (act.includes('MILITARY HISTORY') || act.includes('MH')) {
      const match = subjects.find(s => s.name.toLowerCase().includes('military history'));
      return match ? match.id : null;
    }
    if (act.includes('PAINTING')) {
      const match = subjects.find(s => s.name.toLowerCase().includes('painting'));
      return match ? match.id : null;
    }
    if (act.includes('PYQ')) {
      const match = subjects.find(s => s.name.toLowerCase().includes('previous year') || s.name.toLowerCase().includes('pyq'));
      return match ? match.id : null;
    }
    if (act.includes('CURRENT AFFAIRS')) {
      const match = subjects.find(s => s.name.toLowerCase().includes('general studies') || s.name.toLowerCase().includes('gk'));
      return match ? match.id : null;
    }
    if (act.includes('GAMES')) {
      const match = subjects.find(s => s.name.toLowerCase().includes('games'));
      return match ? match.id : null;
    }
    if (act.includes('STUDY')) {
      const match = subjects.find(s => s.name.toLowerCase().includes('study'));
      return match ? match.id : null;
    }
    if (act.includes('NIOS')) {
      const match = subjects.find(s => s.name.toLowerCase().includes('nios'));
      return match ? match.id : null;
    }
    return null;
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM timetable_slots');

    // Batch insert slots in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < rawSlots.length; i += chunkSize) {
      const chunk = rawSlots.slice(i, i + chunkSize);
      const values = [];
      const params = [];
      chunk.forEach((slot, idx) => {
        const subId = findSubjectId(slot.activity);
        const base = idx * 14;
        values.push(`($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10},$${base+11},$${base+12},$${base+13},$${base+14})`);
        params.push(
          slot.schedule_key,
          slot.schedule_title,
          slot.programme,
          slot.day_of_week,
          slot.slot_order,
          slot.start_time,
          slot.end_time,
          slot.time_display,
          slot.activity,
          slot.instructor,
          slot.category,
          slot.trackable,
          subId,
          slot.raw_text
        );
      });
      await client.query(`
        INSERT INTO timetable_slots (
          schedule_key, schedule_title, programme, day_of_week, slot_order,
          start_time, end_time, time_display, activity, instructor,
          category, trackable, subject_id, raw_text
        ) VALUES ${values.join(',')}
      `, params);
    }

    // Ensure all active cadets have subject assignments
    const cadets = await client.query("SELECT id FROM users WHERE role = 'cadet'");
    const assignmentValues = [];
    const assignmentParams = [];
    let pIdx = 0;
    for (const cadet of cadets.rows) {
      for (const sub of subjects) {
        assignmentValues.push(`($${pIdx + 1}, $${pIdx + 2})`);
        assignmentParams.push(cadet.id, sub.id);
        pIdx += 2;
      }
    }
    if (assignmentValues.length > 0) {
      await client.query(`
        INSERT INTO subject_assignments (cadet_id, subject_id)
        VALUES ${assignmentValues.join(',')}
        ON CONFLICT (cadet_id, subject_id) DO NOTHING
      `, assignmentParams);
    }

    await client.query('COMMIT');
    console.log(`Seeded all ${rawSlots.length} timetable slots successfully in fast batches!`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

seed()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
