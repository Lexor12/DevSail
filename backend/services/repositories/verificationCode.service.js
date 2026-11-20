//Este archovo permite la creación y gestión de los codigos de 6 digitos hasheados, ya sea para ('email_verification' | 'password_reset')
const pool = require('../../config/db');
const { VerificationCode } = require('../../models/verificationCode.model');

const CODE_COLUMNS = `
    id, user_id AS "userId", purpose, code_hash AS "codeHash", attempts,
    expires_at AS "expiresAt", used_at AS "usedAt", created_at AS "createdAt"
`;

//Esta función permite crear un nuevo codigo de verificación para un usuario, con un proposito especifico, el codigo se guarda hasheado y tiene una fecha de expiracion
async function createCode(userId, purpose, codeHash, expiresAt, db = pool) {
    await db.query(
        `INSERT INTO verification_codes (user_id, purpose, code_hash, expires_at) VALUES ($1, $2, $3, $4)`,
        [userId, purpose, codeHash, expiresAt]
    );
}

//Esta función permite obtener el ultimo código activo no usado por un usuario
async function getLatestActiveCode(userId, purpose, db = pool) {
    const result = await db.query(
        `SELECT ${CODE_COLUMNS} FROM verification_codes WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL ORDER BY created_at DESC LIMIT 1`,
        [userId, purpose]
    );
    if (result.rows.length === 0) return null;//Si no hay codigos activos, entonces retornamos null
    const r = result.rows[0];
    //Si hay un código activo, entonces retornamos un objeto de tipo VerificationCode con los datos del código
    return new VerificationCode(r.id, r.userId, r.purpose, r.codeHash, r.attempts, r.expiresAt, r.usedAt, r.createdAt);
}

//Aumenta el contador de intentos de un código, hasta un máximo de 5 intentos
async function increaseCodeAttempts(codeId, db = pool) {
    await db.query(`UPDATE verification_codes SET attempts = LEAST(attempts + 1, 5) WHERE id = $1`, [codeId]);
}
//Permite marcar un código como usado para que deje de ser funcional y valido
async function markCodeAsUsed(codeId, db = pool) {
    await db.query(`UPDATE verification_codes SET used_at = NOW() WHERE id = $1`, [codeId]);
}
// Borra codigos previos sin usar antes de generar uno nuevo
async function deleteUnusedCodes(userId, purpose, db = pool) {
    await db.query(`DELETE FROM verification_codes WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL`, [userId, purpose]);
}
// Cuenta cuantos codigos se enviaron en la ultima hora (limite de 5 por hora)
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