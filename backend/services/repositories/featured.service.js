// Permite la gestión de los proyectos destacados de 7 o 30 dias
const pool = require('../../config/db');
const { FeaturedProject } = require('../../models/featured.model');

// Esta función permite crear un nuevo proyecto destacado, si ya tiene un periodo vigente o programado, el nuevo empieza donde termina el ultimo (status = 'scheduled')
async function createFeatured(projectId, durationDays, paymentId, db = pool) {
    const sentence = `
        WITH calc AS (
            SELECT COALESCE(MAX(ends_at), NOW()) AS base_end
            FROM featured_projects
            WHERE project_id = $1 AND status IN ('active', 'scheduled') AND ends_at > NOW()
        )
        INSERT INTO featured_projects (project_id, payment_id, duration_days, starts_at, ends_at, status)
        SELECT
            $1,
            $3,
            $2,
            GREATEST(NOW(), calc.base_end),
            GREATEST(NOW(), calc.base_end) + ($2::int * INTERVAL '1 day'),
            CASE WHEN calc.base_end > NOW() THEN 'scheduled' ELSE 'active' END
        FROM calc
        RETURNING id, project_id AS "projectId", payment_id AS "paymentId", duration_days AS "durationDays",
        starts_at AS "startsAt", ends_at AS "endsAt", status, removed_reason AS "removedReason",
        removed_at AS "removedAt", removed_by AS "removedBy", created_at AS "createdAt"
    `;
    const result = await db.query(sentence, [projectId, durationDays, paymentId]);
    const r = result.rows[0];
    return new FeaturedProject(
        r.id, r.projectId, r.paymentId, r.durationDays, r.startsAt, r.endsAt,
        r.status, r.removedReason, r.removedAt, r.removedBy, r.createdAt
    );
}

// Permite verificar si un proyecto tiene un destacado activo, devolviendo true o false
async function isProjectFeatured(projectId, db = pool) {
    const result = await db.query(
        `SELECT 1 FROM featured_projects WHERE project_id = $1 AND status = 'active' AND starts_at <= NOW() AND ends_at > NOW() LIMIT 1`,
        [projectId]
    );
    return result.rows.length > 0;
}

// Retira el destacado activo y borra los programados en cola
async function withdrawFeatured(projectId, reason, adminId, db = pool) {
    await db.query(`DELETE FROM featured_projects WHERE project_id = $1 AND status = 'scheduled'`, [projectId]);
    const result = await db.query(
        `UPDATE featured_projects
        SET status = 'removed', removed_reason = $2, removed_at = NOW(), removed_by = $3
        WHERE project_id = $1 AND status = 'active' AND ends_at > NOW()
        RETURNING id`,
        [projectId, reason, adminId]
    );
    return result.rows.map(r => r.id);
}

// Permite obtener la lista de proyectos destacados activos, ordenados por fecha de vencimiento ascendente
async function getActiveFeaturedList(db = pool) {
    const sentence = `
        SELECT f.id, f.project_id AS "projectId", f.payment_id AS "paymentId", f.duration_days AS "durationDays",
        f.starts_at AS "startsAt", f.ends_at AS "endsAt", f.status, f.removed_reason AS "removedReason",
        f.removed_at AS "removedAt", f.removed_by AS "removedBy", f.created_at AS "createdAt",
        p.nickname AS "projectNickname", u.username AS "ownerUsername"
        FROM featured_projects f
        JOIN projects p ON p.id = f.project_id
        JOIN users u ON u.id = p.owner_id
        WHERE f.status = 'active' AND f.starts_at <= NOW() AND f.ends_at > NOW()
        ORDER BY f.ends_at ASC
    `;
    const result = await db.query(sentence);
    return result.rows.map(r => new FeaturedProject(
        r.id, r.projectId, r.paymentId, r.durationDays, r.startsAt, r.endsAt,
        r.status, r.removedReason, r.removedAt, r.removedBy, r.createdAt,
        r.projectNickname, r.ownerUsername
    ));
}

// Permite obtener la lista de proyectos destacados que vencen en las proximas 'hours' horas, ordenados por fecha de vencimiento ascendente
async function getFeaturedEndingSoon(hours, db = pool) {
    const sentence = `
        SELECT f.id, f.project_id AS "projectId", f.payment_id AS "paymentId", f.duration_days AS "durationDays",
        f.starts_at AS "startsAt", f.ends_at AS "endsAt", f.status, f.removed_reason AS "removedReason",
        f.removed_at AS "removedAt", f.removed_by AS "removedBy", f.created_at AS "createdAt",
        p.nickname AS "projectNickname", u.username AS "ownerUsername"
        FROM featured_projects f
        JOIN projects p ON p.id = f.project_id
        JOIN users u ON u.id = p.owner_id
        WHERE f.status = 'active' AND f.starts_at <= NOW() AND f.ends_at > NOW()
          AND f.ends_at <= NOW() + ($1::int * INTERVAL '1 hour')
        ORDER BY f.ends_at ASC
    `;
    const result = await db.query(sentence, [hours]);
    return result.rows.map(r => new FeaturedProject(
        r.id, r.projectId, r.paymentId, r.durationDays, r.startsAt, r.endsAt,
        r.status, r.removedReason, r.removedAt, r.removedBy, r.createdAt,
        r.projectNickname, r.ownerUsername
    ));
}

// Tarea programada cada hora: expira los vencidos y activa los programados
async function syncFeaturedLifecycle(db = pool) {
    await db.query(`UPDATE featured_projects SET status = 'expired' WHERE status = 'active' AND ends_at <= NOW()`);
    await db.query(`UPDATE featured_projects SET status = 'active' WHERE status = 'scheduled' AND starts_at <= NOW() AND ends_at > NOW()`);
}

module.exports = {
    createFeatured, isProjectFeatured, withdrawFeatured,
    getActiveFeaturedList, getFeaturedEndingSoon, syncFeaturedLifecycle
};