//Maneja los codigos de 6 digitos hasheados para verificar correo o recuperar contraseña
const pool = require('../../config/db');
const { VerificationCode } = require('../../models/verificationCode.model');

const CODE_COLUMNS = `
    id, user_id AS "userId", purpose, code_hash AS "codeHash", attempts,
    expires_at AS "expiresAt", used_at AS "usedAt", created_at AS "createdAt"
`;

//Crea un codigo hasheado con su proposito y fecha de expiracion
async function createCode(userId, purpose, codeHash, expiresAt, db = pool) {
    await db.query(
        `INSERT INTO verification_codes (user_id, purpose, code_hash, expires_at) VALUES ($1, $2, $3, $4)`,
        [userId, purpose, codeHash, expiresAt]
    );
}

//Ultimo codigo sin usar de un usuario
async function getLatestActiveCode(userId, purpose, db = pool) {
    const result = await db.query(
        `SELECT ${CODE_COLUMNS} FROM verification_codes WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL ORDER BY created_at DESC LIMIT 1`,
        [userId, purpose]
    );
    if (result.rows.length === 0) return null;//Si no hay codigos activos regresamos null
    const r = result.rows[0];
    //Si hay uno lo regresamos como objeto VerificationCode
    return new VerificationCode(r.id, r.userId, r.purpose, r.codeHash, r.attempts, r.expiresAt, r.usedAt, r.createdAt);
}

//Suma un intento al codigo, hasta 5
async function increaseCodeAttempts(codeId, db = pool) {
    await db.query(`UPDATE verification_codes SET attempts = LEAST(attempts + 1, 5) WHERE id = $1`, [codeId]);
}
//Marca el codigo como usado para que ya no sirva
async function markCodeAsUsed(codeId, db = pool) {
    await db.query(`UPDATE verification_codes SET used_at = NOW() WHERE id = $1`, [codeId]);
}
// Borra los codigos sin usar antes de crear otro
async function deleteUnusedCodes(userId, purpose, db = pool) {
    await db.query(`DELETE FROM verification_codes WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL`, [userId, purpose]);
}
// Codigos enviados en la ultima hora, el limite son 5
async function countCodesSince(userId, purpose, sinceDate, db = pool) {
    const result = await db.query(
        `SELECT COUNT(*)::int AS total FROM verification_codes WHERE user_id = $1 AND purpose = $2 AND created_at >= $3`,
        [userId, purpose, sinceDate]
    );
    return result.rows[0].total;
}

module.exports = {
    createCode, getLatestActiveCode, increaseCodeAttempts,
    markCodeAsUsed, deleteUnusedCodes, countCodesSince
};