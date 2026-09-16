require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const run = async () => {
  const directory = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(directory).filter((file) => file.endsWith('.sql')).sort();
  try {
    for (const file of files) {
      await pool.query(fs.readFileSync(path.join(directory, file), 'utf8'));
      console.log(`Applied ${file}`);
    }
  } finally {
    await pool.end();
  }
};
run().catch((error) => { console.error(`Migration failed: ${error.message || error.code || 'unknown database error'}${error.detail ? ` (${error.detail})` : ''}`); process.exitCode = 1; });
