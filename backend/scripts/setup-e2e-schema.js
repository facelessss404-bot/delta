require('dotenv').config();
const pool = require('../config/db');

const targetSchema = 'e2e_test';

async function main() {
  if (process.env.TEST_DATABASE_ISOLATED !== 'true') throw new Error('Set TEST_DATABASE_ISOLATED=true before modifying the test schema.');
  if (process.argv.includes('--reset')) {
    await pool.query(`DROP SCHEMA IF EXISTS ${targetSchema} CASCADE`);
  }
  await pool.query(`CREATE SCHEMA IF NOT EXISTS ${targetSchema}`);
  const result = await pool.query('SELECT current_database() AS database');
  const expectedDatabase = process.env.TEST_DATABASE_EXPECTED_NAME || 'postgres';
  if (result.rows[0].database !== expectedDatabase) throw new Error('Database validation failed.');
  console.log(`Ready: ${result.rows[0].database}/${targetSchema}`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
