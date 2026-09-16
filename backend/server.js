require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const rateLimit = require('./middleware/rateLimit');
const sendMail = require('./utils/mailer');

// In production the built React app lives in backend/public/
const clientDir = path.join(__dirname, 'public');

const app = express();
app.disable('x-powered-by');
// API responses include account-specific data. Conditional ETags can turn a
// valid session check into a 304 response, which Axios treats as an error and
// causes the client to clear its session after a reload or route change.
app.disable('etag');
app.set('trust proxy', 1);
const origins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',');
app.use((req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');next();});
app.use((req, res, next) => { const started = process.hrtime.bigint(); const end = res.end; res.end = function endWithTiming(...args) { if (!res.headersSent) { const duration = Number(process.hrtime.bigint() - started) / 1e6; res.setHeader('Server-Timing', `app;dur=${duration.toFixed(1)}`); } return end.apply(this, args); }; res.on('finish', () => { const duration = Number(process.hrtime.bigint() - started) / 1e6; console.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration.toFixed(1)}ms`); }); next(); });
app.use(cors({ origin: origins, credentials: true })); app.use(rateLimit());
app.use(express.json());
app.get('/api/health', async (_req, res) => { try { await pool.query('SELECT 1'); res.json({ ok: true, database: 'supabase_postgresql', timestamp: new Date().toISOString() }); } catch (_error) { res.status(503).json({ ok: false, database: 'unavailable' }); } });
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }), require('./routes/authRoutes')); app.use('/api/auth', require('./routes/passwordReset')); app.use('/api/cadets', require('./routes/cadetRoutes')); app.use('/api/admins', require('./routes/adminRoutes')); app.use('/api/subjects', require('./routes/subjectRoutes')); app.use('/api/attendance', require('./routes/sessionAttendance')); app.use('/api/legacy-attendance', require('./routes/attendanceRoutes')); app.use('/api/academics', require('./routes/academics')); app.use('/api/dashboard', require('./routes/dashboardRoutes')); app.use('/api/physical', require('./routes/physical')); app.use('/api/counselling-registrations', require('./routes/registrationRoutes')); app.use('/api/notices', require('./routes/notices')); app.use('/api/notes', require('./routes/notes')); app.use('/api/exams', require('./routes/exams')); app.use('/api/results', require('./routes/results')); app.use('/api/leaves', require('./routes/leaves')); app.use('/api/reports', require('./routes/reportRoutes')); app.use('/api/audit-logs', require('./routes/auditRoutes')); app.use('/api/settings', require('./routes/settings')); app.use('/api/notifications', require('./routes/notifications'));
// ---------- Static frontend serving (production) ----------
const fs = require('fs');
const hasClientBuild = fs.existsSync(path.join(clientDir, 'index.html'));
if (hasClientBuild) {
  app.use(express.static(clientDir, { maxAge: '7d', immutable: true, index: false }));
  // SPA fallback: any non-API GET that isn't a static file gets index.html
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(clientDir, 'index.html')));
  console.log('Serving frontend from', clientDir);
} else {
  app.get('/', (_req, res) => res.json({ name: 'Delta Squad API', database: 'Supabase PostgreSQL', note: 'Frontend not bundled — run the build script or deploy via Render.' }));
}

app.use((error, _req, res, _next) => { console.error(error.message); res.status(500).json({ message: 'Internal server error' }); });

if (require.main === module) {
  const port = process.env.PORT || 5000;
  pool.query('SELECT 1').then(async () => {
    if (!sendMail.smtpConfigured()) console.warn('SMTP is not configured; email delivery is disabled while in-app notifications remain available.');
    // Express 5 app.listen() returns a Promise<http.Server>. We must await it
    // so the server socket is open before we proceed, keeping the event loop alive.
    const server = await app.listen(port);
    console.log(`Delta Squad API listening on ${port}`);
    const shutdown = async (signal) => {
      console.log(`${signal} received, shutting down gracefully...`);
      server.close(async () => { await pool.end(); process.exit(0); });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }).catch((error) => { console.error('Supabase PostgreSQL connection failed:', error.message); process.exit(1); });
}
module.exports = app;
