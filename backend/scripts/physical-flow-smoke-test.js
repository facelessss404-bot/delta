const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env.test'), override: true, quiet: true });

const required = [
  'TEST_DATABASE_URL', 'TEST_DATABASE_EXPECTED_NAME', 'TEST_CADET_EMAIL', 'TEST_CADET_PASSWORD',
  'TEST_ADMIN_EMAIL', 'TEST_ADMIN_PASSWORD', 'TEST_JWT_SECRET', 'TEST_SUPABASE_URL',
  'TEST_SUPABASE_SERVICE_ROLE_KEY',
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Physical smoke test is not configured: ${missing.join(', ')}`);
if (process.env.TEST_DATABASE_ISOLATED !== 'true' || process.env.TEST_ALLOW_DESTRUCTIVE !== 'true') {
  throw new Error('Set TEST_DATABASE_ISOLATED=true and TEST_ALLOW_DESTRUCTIVE=true to run this cleanup-safe test.');
}

const databaseName = new URL(process.env.TEST_DATABASE_URL).pathname.slice(1).toLowerCase();
const schema = (process.env.TEST_DATABASE_EXPECTED_SCHEMA || '').toLowerCase();
const isolatedTarget = databaseName.includes('test') || databaseName.includes('qa') || databaseName.includes('sandbox') || databaseName.includes('e2e') || (schema !== 'public' && /test|qa|sandbox|e2e/.test(schema));
if (!isolatedTarget || databaseName !== process.env.TEST_DATABASE_EXPECTED_NAME.toLowerCase()) {
  throw new Error('Physical smoke test refused: TEST_DATABASE_URL must target the named isolated test database or schema.');
}

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.DB_SCHEMA = process.env.TEST_DATABASE_EXPECTED_SCHEMA || '';
process.env.JWT_SECRET = process.env.TEST_JWT_SECRET;
process.env.SUPABASE_URL = process.env.TEST_SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
process.env.SUPABASE_VIDEOS_BUCKET = process.env.TEST_SUPABASE_VIDEOS_BUCKET || 'physical-videos';

const app = require('../server');
const pool = require('../config/db');
const storage = require('../config/supabaseStorage');

const request = async (base, endpoint, options = {}) => {
  const response = await fetch(`${base}${endpoint}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${endpoint} failed (${response.status}): ${body.message || 'unknown error'}`);
  return body;
};

const login = (base, email, password) => request(base, '/api/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
});

const run = async () => {
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const bucket = process.env.SUPABASE_VIDEOS_BUCKET;
  let submissionId;
  let storageKey;
  try {
    const bucketResponse = await fetch(`${process.env.SUPABASE_URL}/storage/v1/bucket/${encodeURIComponent(bucket)}`, {
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    });
    const bucketInfo = await bucketResponse.json();
    if (!bucketResponse.ok || bucketInfo.public) throw new Error(`Storage bucket ${bucket} is unavailable or public.`);

    const cadet = await login(base, process.env.TEST_CADET_EMAIL, process.env.TEST_CADET_PASSWORD);
    const admin = await login(base, process.env.TEST_ADMIN_EMAIL, process.env.TEST_ADMIN_PASSWORD);
    // Minimal ISO base-media header so server-side MP4 signature validation is exercised.
    const payload = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32]);
    const metadata = { activityType: 'Morning Run', activityDate: '2026-09-15', filename: 'smoke-test.mp4', mimeType: 'video/mp4', fileSize: payload.length };
    const cadetHeaders = { Authorization: `Bearer ${cadet.token}`, 'Content-Type': 'application/json' };
    const signed = await request(base, '/api/physical/presign', { method: 'POST', headers: cadetHeaders, body: JSON.stringify(metadata) });
    storageKey = signed.storageKey;
    const upload = await fetch(signed.uploadUrl, { method: 'PUT', headers: { Authorization: `Bearer ${signed.uploadToken}`, 'Content-Type': metadata.mimeType, 'x-upsert': 'false' }, body: payload });
    if (!upload.ok) throw new Error(`Signed video upload failed (${upload.status}).`);

    const submission = await request(base, '/api/physical/complete', { method: 'POST', headers: cadetHeaders, body: JSON.stringify({ ...metadata, storageKey }) });
    submissionId = submission.id;
    if (submission.upload_status !== 'uploaded') throw new Error('Physical metadata was not stored as uploaded.');

    const mine = await request(base, '/api/physical/my', { headers: { Authorization: `Bearer ${cadet.token}` } });
    if (!mine.some((item) => item.id === submissionId)) throw new Error('Cadet submission history does not include the new submission.');

    const view = await request(base, `/api/physical/${submissionId}/view-url`, { headers: { Authorization: `Bearer ${cadet.token}` } });
    const downloaded = Buffer.from(await (await fetch(view.viewUrl)).arrayBuffer());
    if (!downloaded.equals(payload)) throw new Error('Signed video view content did not match the uploaded file.');

    const all = await request(base, '/api/physical', { headers: { Authorization: `Bearer ${admin.token}` } });
    if (!all.some((item) => item.id === submissionId)) throw new Error('Staff review queue does not include the new submission.');
    const reviewed = await request(base, `/api/physical/${submissionId}/review`, { method: 'PATCH', headers: { Authorization: `Bearer ${admin.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ reviewStatus: 'accepted', comment: 'Automated isolated test' }) });
    if (reviewed.review_status !== 'accepted' || reviewed.reviewer_comment !== 'Automated isolated test') throw new Error('Staff review was not stored.');

    console.log('PASS: private Supabase upload, metadata completion, signed viewing, staff queue, and review all succeeded.');
  } finally {
    if (submissionId) {
      await pool.query("DELETE FROM audit_logs WHERE entity_type='physical_submission' AND entity_id=$1", [String(submissionId)]);
      await pool.query('DELETE FROM physical_submissions WHERE id=$1', [submissionId]);
    }
    if (storageKey) await storage.removeObject({ bucket, key: storageKey });
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
};

run().catch((error) => { console.error(`FAIL: ${error.message}`); process.exitCode = 1; });
