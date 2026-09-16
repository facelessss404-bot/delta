const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Configure your Supabase PostgreSQL connection in backend/.env.');
}

const configuredSchema = process.env.DB_SCHEMA?.trim();
if (configuredSchema && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(configuredSchema)) throw new Error('DB_SCHEMA must be a simple PostgreSQL schema identifier.');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Supabase Free exposes a small connection budget. Keep the API below it.
  max: Number(process.env.DB_POOL_MAX || 4),
  // With Supabase's transaction pooler, a standalone SET search_path is reset
  // after COMMIT. Send it as a startup option so every transaction retains the
  // selected schema.
  ...(configuredSchema ? { options: `-c search_path=${configuredSchema}` } : {}),
});
if (configuredSchema) {
  // Set the schema after checkout so pooled connections remain compatible with Supabase.
  const baseConnect = pool.connect.bind(pool);
  pool.connect = async (...args) => {
    const client = await baseConnect(...args);
    if (!client.__digicampusSchema) {
      // A database socket can be terminated while a checked-out client is active.
      // Without a client-level listener Node treats that event as fatal and
      // takes down the API process before the pool can recover the connection.
      client.on('error', (error) => console.error('PostgreSQL client error:', error.message));
      client.__digicampusSchema = configuredSchema;
    }
    // Supabase's transaction pooler can reset session settings between
    // checkouts. Reapply the schema every time so queries never fall back to
    // public (or another schema) after a connection is reused.
    await client.query(`SET search_path TO ${configuredSchema}`);
    return client;
  };
  pool.query = async (...args) => {
    const client = await pool.connect();
    try { return await client.query(...args); } finally { client.release(); }
  };
}
pool.on('error', (error) => console.error('PostgreSQL pool error:', error.message));
module.exports = pool;
