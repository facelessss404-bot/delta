const pool = require('../config/db');

const writeAudit = async ({ actorId, action, entityType, entityId, before, after, client }) => {
  try {
    await (client || pool).query(
      'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, before_data, after_data) VALUES ($1, $2, $3, $4, $5, $6)',
      [actorId || null, action, entityType, entityId ? String(entityId) : null, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null]
    );
  } catch (error) {
    console.error('Audit write failed:', error.message);
  }
};

module.exports = { writeAudit };
