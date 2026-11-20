// Este archivo contiene funciones para interactuar con la tabla de pagos en la base de datos, incluyendo creación, actualización y consulta de pagos.
const pool = require('../../config/db');
const { MX_TIMEZONE } = require('./supabase.config.js');
const { Payment } = require('../../models/payment.model');
// Esta constante define las columnas que se seleccionarán de la tabla de pagos, para evitar repetir código y mantener consistencia
const PAYMENT_COLUMNS = `
    pay.id, pay.user_id AS "userId", pay.concept, pay.project_id AS "projectId",
    pay.amount::float, pay.currency, pay.paypal_order_id AS "paypalOrderId",
    pay.paypal_capture_id AS "paypalCaptureId", pay.status,
    pay.created_at AS "createdAt", pay.completed_at AS "completedAt"
`;
// Esta función mapea los resultados de la base de datos a un objeto de tipo Payment, para facilitar su uso en el código
function mapPayment(r) {
    return new Payment(
        r.id, r.userId, r.concept, r.projectId, r.amount, r.currency,
        r.paypalOrderId, r.paypalCaptureId, r.status, r.createdAt, r.completedAt,
        r.username ?? null, r.projectNickname ?? null
    );
}

//Permite crear un nuevo pago en la base de datos, con los datos proporcionados, y retorna el id del nuevo pago
async function createPayment(data, db = pool) {
    const sentence = `
        INSERT INTO payments (user_id, concept, project_id, amount, paypal_order_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    `;
    const result = await db.query(sentence, [
        data.userId, data.concept, data.projectId || null, data.amount, data.paypalOrderId
    ]);
    return result.rows[0].id;
}

//Permite obtener un pago por su id, si no existe retorna null
async function getPaymentByOrderId(paypalOrderId, db = pool) {
    const result = await db.query(
        `SELECT ${PAYMENT_COLUMNS} FROM payments pay WHERE pay.paypal_order_id = $1`,
        [paypalOrderId]
    );
    return result.rows.length > 0 ? mapPayment(result.rows[0]) : null;
}

//Permite marcar un pago como completado, actualizando su estado y guardando el id de captura de PayPal
async function markPaymentCompleted(paymentId, paypalCaptureId, db = pool) {
    await db.query(
        `UPDATE payments SET status = 'completed', paypal_capture_id = $2, completed_at = NOW() WHERE id = $1`,
        [paymentId, paypalCaptureId]
    );
}

//Permite actualizar el estado de un pago, por ejemplo a 'failed' o 'pending'
async function setPaymentStatus(paymentId, status, db = pool) {
    await db.query(`UPDATE payments SET status = $2 WHERE id = $1`, [paymentId, status]);
}
//Permite obtener todos los pagos de un usuario, ordenados por fecha de creación descendente
async function getPaymentsByUser(userId, db = pool) {
    const sentence = `
        SELECT ${PAYMENT_COLUMNS}, p.nickname AS "projectNickname"
        FROM payments pay
        LEFT JOIN projects p ON p.id = pay.project_id
        WHERE pay.user_id = $1
        ORDER BY pay.created_at DESC
    `;
    const result = await db.query(sentence, [userId]);
    return result.rows.map(mapPayment);
}

// Esta función construye la cláusula WHERE y los parámetros para filtrar pagos según los criterios proporcionados
function buildPaymentFilters(filters) {
    const conditions = ['TRUE'];
    const params = [];
    const add = (value) => {
        params.push(value);
        return `$${params.length}`;
    };
    if (filters.dateFrom) conditions.push(`(pay.created_at AT TIME ZONE ${MX_TIMEZONE})::date >= ${add(filters.dateFrom)}::date`);
    if (filters.dateTo) conditions.push(`(pay.created_at AT TIME ZONE ${MX_TIMEZONE})::date <= ${add(filters.dateTo)}::date`);
    if (filters.concept) conditions.push(`pay.concept = ${add(filters.concept)}`);
    if (filters.status) conditions.push(`pay.status = ${add(filters.status)}`);
    if (filters.username) conditions.push(`u.username ILIKE ${add(`%${filters.username}%`)}`);
    return { where: conditions.join(' AND '), params, add };
}

// Permite obtener una lista de pagos filtrados por los criterios proporcionados, con paginación y ordenamiento
async function getPayments(filters, db = pool) {
    const { where, params, add } = buildPaymentFilters(filters);
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const limit = add(pageSize);
    const offset = add((page - 1) * pageSize);

    const sentence = `
        SELECT ${PAYMENT_COLUMNS}, u.username, p.nickname AS "projectNickname", COUNT(*) OVER()::int AS total
        FROM payments pay
        LEFT JOIN users u ON u.id = pay.user_id
        LEFT JOIN projects p ON p.id = pay.project_id
        WHERE ${where}
        ORDER BY pay.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await db.query(sentence, params);
    return {
        payments: result.rows.map(mapPayment),
        total: result.rows.length > 0 ? result.rows[0].total : 0
    };
}
// Permite obtener un resumen de pagos completados, incluyendo el monto total y la cantidad de pagos completados, filtrados por los criterios proporcionados
async function getPaymentsSummary(filters, db = pool) {
    const { where, params } = buildPaymentFilters(filters);
    const sentence = `
        SELECT COALESCE(SUM(pay.amount), 0)::float AS "completedAmount", COUNT(*)::int AS "completedCount"
        FROM payments pay
        LEFT JOIN users u ON u.id = pay.user_id
        WHERE ${where} AND pay.status = 'completed'
    `;
    const result = await db.query(sentence, params);
    return result.rows[0];
}
// Exportamos las funciones para que puedan ser usadas en otros archivos
module.exports = {
    createPayment, getPaymentByOrderId, markPaymentCompleted, setPaymentStatus,
    getPaymentsByUser, getPayments, getPaymentsSummary
};