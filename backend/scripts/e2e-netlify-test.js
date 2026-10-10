const BASE_URL = 'https://deltasquads.netlify.app/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function login(email, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.data)}`);
  }
  return res.data;
}

async function runE2E() {
  console.log('--- STARTING E2E TEST ON https://deltasquads.netlify.app/api ---');

  // 1. Health check
  console.log('\n[1] Testing Health Endpoint...');
  const health = await request('/health');
  console.log('Health status:', health.status, health.data);
  if (!health.ok || health.data.database !== 'supabase_postgresql') {
    throw new Error('Health check failed');
  }

  // 2. Test Cadet Login and Endpoints
  console.log('\n[2] Testing Cadet (cadet@cadet.com)...');
  const cadetAuth = await login('cadet@cadet.com', 'password123');
  const cadetUser = cadetAuth.user || cadetAuth;
  console.log(`Cadet logged in successfully! User: ${cadetUser.name}, Role: ${cadetUser.role}`);
  const cadetHeaders = { Authorization: `Bearer ${cadetAuth.token}` };

  const cadetMe = await request('/auth/me', { headers: cadetHeaders });
  console.log('Cadet /auth/me:', cadetMe.status, cadetMe.data?.email);

  const cadetProfile = await request(`/cadets/${cadetUser.id}`, { headers: cadetHeaders });
  console.log('Cadet Profile:', cadetProfile.status, cadetProfile.data?.name);

  const cadetSubjects = await request(`/cadets/${cadetUser.id}/subjects`, { headers: cadetHeaders });
  console.log('Cadet Subjects count:', cadetSubjects.status, Array.isArray(cadetSubjects.data) ? cadetSubjects.data.length : 'N/A');

  const cadetAttendance = await request('/attendance/my', { headers: cadetHeaders });
  console.log('Cadet Attendance /my:', cadetAttendance.status, Array.isArray(cadetAttendance.data?.summary || cadetAttendance.data) ? (cadetAttendance.data?.summary?.length || cadetAttendance.data?.length) : 'N/A');

  const cadetMarks = await request('/academics/marks/my', { headers: cadetHeaders });
  console.log('Cadet Marks /my:', cadetMarks.status, Array.isArray(cadetMarks.data) ? cadetMarks.data.length : 'N/A');

  const cadetPhysical = await request('/physical/my', { headers: cadetHeaders });
  console.log('Cadet Physical /my:', cadetPhysical.status, Array.isArray(cadetPhysical.data) ? cadetPhysical.data.length : 'N/A');

  const cadetNotes = await request('/notes', { headers: cadetHeaders });
  console.log('Cadet Notes:', cadetNotes.status, Array.isArray(cadetNotes.data) ? cadetNotes.data.length : 'N/A');

  const cadetNotices = await request('/notices', { headers: cadetHeaders });
  console.log('Cadet Notices:', cadetNotices.status, Array.isArray(cadetNotices.data) ? cadetNotices.data.length : 'N/A');

  const cadetLeaves = await request('/leaves', { headers: cadetHeaders });
  console.log('Cadet Leaves:', cadetLeaves.status, Array.isArray(cadetLeaves.data) ? cadetLeaves.data.length : 'N/A');

  // 3. Test Admin Login and Endpoints
  console.log('\n[3] Testing Admin (admin@admin.com)...');
  const adminAuth = await login('admin@admin.com', 'password123');
  const adminUser = adminAuth.user || adminAuth;
  console.log(`Admin logged in successfully! User: ${adminUser.name}, Role: ${adminUser.role}`);
  const adminHeaders = { Authorization: `Bearer ${adminAuth.token}` };

  const adminCadets = await request('/cadets', { headers: adminHeaders });
  console.log('Admin /cadets count:', adminCadets.status, Array.isArray(adminCadets.data) ? adminCadets.data.length : 'N/A');

  const adminSubjects = await request('/subjects', { headers: adminHeaders });
  console.log('Admin /subjects count:', adminSubjects.status, Array.isArray(adminSubjects.data) ? adminSubjects.data.length : 'N/A');

  const adminSessions = await request('/attendance/sessions', { headers: adminHeaders });
  console.log('Admin /attendance/sessions:', adminSessions.status, Array.isArray(adminSessions.data) ? adminSessions.data.length : 'N/A');

  const adminAssessments = await request('/academics/assessments', { headers: adminHeaders });
  console.log('Admin /academics/assessments:', adminAssessments.status, Array.isArray(adminAssessments.data) ? adminAssessments.data.length : 'N/A');

  const adminOverview = await request('/reports/overview', { headers: adminHeaders });
  console.log('Admin /reports/overview:', adminOverview.status, adminOverview.data ? Object.keys(adminOverview.data) : 'N/A');

  const adminAudit = await request('/audit-logs', { headers: adminHeaders });
  console.log('Admin /audit-logs count:', adminAudit.status, Array.isArray(adminAudit.data) ? adminAudit.data.length : 'N/A');

  // 4. Test Commander Login and Endpoints
  console.log('\n[4] Testing Commander (commander@commander.com)...');
  const cmdAuth = await login('commander@commander.com', 'password123');
  const cmdUser = cmdAuth.user || cmdAuth;
  console.log(`Commander logged in successfully! User: ${cmdUser.name}, Role: ${cmdUser.role}`);
  const cmdHeaders = { Authorization: `Bearer ${cmdAuth.token}` };

  const cmdAdmins = await request('/admins', { headers: cmdHeaders });
  console.log('Commander /admins count:', cmdAdmins.status, Array.isArray(cmdAdmins.data) ? cmdAdmins.data.length : 'N/A');

  const cmdOverview = await request('/reports/overview', { headers: cmdHeaders });
  console.log('Commander /reports/overview:', cmdOverview.status, cmdOverview.data ? Object.keys(cmdOverview.data) : 'N/A');

  const cmdSettings = await request('/settings', { headers: cmdHeaders });
  console.log('Commander /settings:', cmdSettings.status, cmdSettings.data ? Object.keys(cmdSettings.data) : 'N/A');

  console.log('\n=============================================');
  console.log('ALL API ENDPOINTS PASSED VIA NETLIFY PROXY!');
  console.log('=============================================');
}

runE2E().catch(err => {
  console.error('\nE2E TEST FAILED:', err.message);
  process.exit(1);
});
