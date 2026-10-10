/**
 * Helper script to update the Training Commander's credentials.
 * Usage:
 *   node backend/scripts/change-commander-credentials.js "new_email@delta.com" "new_secure_password" "Lt. Esan"
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function updateCommander() {
  const args = process.argv.slice(2);
  const newEmail = (args[0] || 'commander@commander.com').toLowerCase().trim();
  const newPassword = args[1] || 'password123';
  const newName = args[2] || 'Training Commander Lt. Esan';

  console.log(`Updating Training Commander credentials...`);
  console.log(`Target Email: ${newEmail}`);
  console.log(`Target Name:  ${newName}`);

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Check if commander exists
  const existing = await pool.query("SELECT id FROM users WHERE role = 'commander' LIMIT 1");

  if (existing.rows.length) {
    const cmdId = existing.rows[0].id;
    await pool.query(
      "UPDATE users SET email = $1, password = $2, name = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4",
      [newEmail, hashedPassword, newName, cmdId]
    );
    console.log(`✅ Successfully updated Commander (ID: ${cmdId})`);
  } else {
    const ins = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'commander') RETURNING id",
      [newName, newEmail, hashedPassword]
    );
    console.log(`✅ Created new Commander account (ID: ${ins.rows[0].id})`);
  }

  console.log('---------------------------------------------');
  console.log('NEW COMMANDER CREDENTIALS:');
  console.log(`Email:    ${newEmail}`);
  console.log(`Password: ${newPassword}`);
  console.log('---------------------------------------------');
}

updateCommander()
  .catch((err) => {
    console.error('Error updating commander:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
