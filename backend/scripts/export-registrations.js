const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });
const fs = require('fs');

if (!process.env.DATABASE_URL) {
  console.error('FATAL ERROR: DATABASE_URL is not defined in .env file.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const exportRegistrations = async () => {
  const args = process.argv.slice(2);
  let programFilter = null;
  let sinceFilter = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--program' && args[i+1]) {
      programFilter = args[i+1].toUpperCase();
      i++;
    } else if (args[i] === '--since' && args[i+1]) {
      sinceFilter = args[i+1];
      i++;
    }
  }

  try {
    let query = 'SELECT * FROM counselling_registrations';
    let params = [];
    let conditions = [];

    if (programFilter) {
      conditions.push(`program = $${params.length + 1}`);
      params.push(programFilter);
    }

    if (sinceFilter) {
      conditions.push(`created_at >= $${params.length + 1}`);
      params.push(sinceFilter);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY created_at DESC';

    console.log(`Executing query... (Program: ${programFilter || 'ALL'}, Since: ${sinceFilter || 'ALL'})`);
    
    const result = await pool.query(query, params);
    const records = result.rows;

    if (records.length === 0) {
      console.log('No registrations found matching the criteria.');
      process.exit(0);
    }

    // Generate CSV
    const headers = ['ID', 'Reference ID', 'Program', 'Full Name', 'Phone', 'Email', 'DOB/Age', 'Education Level', 'Mode', 'Consent', 'Status', 'Created At', 'Notes', 'Additional Notes'];
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of records) {
      const escapeCsv = (str) => {
        if (!str) return '';
        const stringified = String(str);
        if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
          return `"${stringified.replace(/"/g, '""')}"`;
        }
        return stringified;
      };

      const csvRow = [
        row.id,
        row.reference_id,
        row.program,
        escapeCsv(row.full_name),
        escapeCsv(row.phone),
        escapeCsv(row.email),
        escapeCsv(row.dob_or_age),
        escapeCsv(row.education_level),
        row.mode,
        row.consent,
        row.status,
        row.created_at.toISOString(),
        escapeCsv(row.notes),
        escapeCsv(row.additional_notes)
      ];
      csvRows.push(csvRow.join(','));
    }

    const csvData = csvRows.join('\n');
    const filename = `registrations_export_${Date.now()}.csv`;
    
    fs.writeFileSync(filename, csvData);
    console.log(`\nSuccess! Exported ${records.length} records to ${filename}`);
    console.log(`Path: ${process.cwd()}\\${filename}`);

  } catch (error) {
    console.error('Error exporting registrations:', error);
  } finally {
    pool.end();
  }
};

exportRegistrations();
