// Bitacora de acciones del administrador 
const pool = require('../../config/db');

async function createModerationLog(data, db = pool) {
    await db.query(
        `INSERT INTO moderation_logs (admin_id, action, target_type, target_id, reason)
        VALUES ($1, $2, $3, $4, $5)`,
        [data.adminId, data.action, data.targetType, data.targetId, data.reason || null]
    );
}

module.exports = { createModerationLog };