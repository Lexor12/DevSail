//Este archivo contiene las funciones para gestionar las Suscripciones del Plan Pro (30 dias acumulables)
const pool = require('../../config/db');
const { ProSubscription } = require('../../models/subscription.model');

// Si ya tiene un periodo vigente o programado, el nuevo empieza donde termina el ultimo (status = 'scheduled')
async function createProSubscription(userId, days, paymentId, db = pool) {
    const sentence = `
        WITH calc AS (
            SELECT COALESCE(MAX(ends_at), NOW()) AS base_end
            FROM pro_subscriptions
            WHERE user_id = $1 AND status IN ('active', 'scheduled') AND ends_at > NOW()
        )
        INSERT INTO pro_subscriptions (user_id, payment_id, starts_at, ends_at, status)
        SELECT
            $1,
            $3,
            GREATEST(NOW(), calc.base_end),
            GREATEST(NOW(), calc.base_end) + ($2::int * INTERVAL '1 day'),
            CASE WHEN calc.base_end > NOW() THEN 'scheduled' ELSE 'active' END
        FROM calc
        RETURNING id, user_id AS "userId", payment_id AS "paymentId", starts_at AS "startsAt",
        ends_at AS "endsAt", status, created_at AS "createdAt"
    `;
    const result = await db.query(sentence, [userId, days, paymentId]);
    const r = result.rows[0];
    return new ProSubscription(r.id, r.userId, r.paymentId, r.startsAt, r.endsAt, r.status, r.createdAt);
}

// Devuelve la fecha maxima hasta la que el usuario tiene cubierto su Plan Pro (o null)
async function getCurrentOrScheduledEnd(userId, db = pool) {
    const result = await db.query(
        `SELECT MAX(ends_at) AS "endsAt" FROM pro_subscriptions
        WHERE user_id = $1 AND status IN ('active', 'scheduled') AND ends_at > NOW()`,
        [userId]
    );
    return result.rows[0].endsAt;
}

//Permite verificar si un usuario tiene una suscripción activa al Plan Pro, devolviendo true o false
async function isUserPro(userId, db = pool) {
    const result = await db.query(
        `SELECT 1 FROM pro_subscriptions WHERE user_id = $1 AND status = 'active' AND starts_at <= NOW() AND ends_at > NOW() LIMIT 1`,
        [userId]
    );
    return result.rows.length > 0;
}

// Tarea programada cada hora: vence los periodos pasados y activa los programados que ya iniciaron
async function syncSubscriptionsLifecycle(db = pool) {
    await db.query(`UPDATE pro_subscriptions SET status = 'expired' WHERE status = 'active' AND ends_at <= NOW()`);
    await db.query(`UPDATE pro_subscriptions SET status = 'active' WHERE status = 'scheduled' AND starts_at <= NOW() AND ends_at > NOW()`);
}

module.exports = { createProSubscription, getCurrentOrScheduledEnd, isUserPro, syncSubscriptionsLifecycle };