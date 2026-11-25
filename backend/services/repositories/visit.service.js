// Registra visitas y saca estadisticas por proyecto y fecha
const pool = require('../../config/db');
const { MX_TIMEZONE } = require('./supabase.config.js');

// Suma una visita al dia de hoy en horario de Ciudad de Mexico
async function registerProjectVisit(projectId, db = pool) {
    const sentence = `
        INSERT INTO daily_visits (project_id, visit_date, visits)
        VALUES ($1, (NOW() AT TIME ZONE ${MX_TIMEZONE})::date, 1)
        ON CONFLICT (project_id, visit_date)
        DO UPDATE SET visits = daily_visits.visits + 1
    `;
    await db.query(sentence, [projectId]);
}

// Visitas por dia para la grafica del Plan Pro
async function getDailyVisitsSeries(ownerId, projectId, days, db = pool) {
    const params = [ownerId, days];
    const projectFilter = projectId ? `AND p.id = $3` : '';
    if (projectId) params.push(projectId);

    const sentence = `
        SELECT v.visit_date::text AS date, SUM(v.visits)::int AS visits
        FROM daily_visits v
        JOIN projects p ON p.id = v.project_id
        WHERE p.owner_id = $1
        AND v.visit_date >= ((NOW() AT TIME ZONE ${MX_TIMEZONE})::date - ($2::int - 1))
        ${projectFilter}
        GROUP BY v.visit_date
        ORDER BY v.visit_date ASC
    `;
    const result = await db.query(sentence, params);
    return result.rows;
}

// Resumen por proyecto para la tabla de estadisticas
async function getProjectsVisitsBreakdown(ownerId, db = pool) {
    const sentence = `
        SELECT
            p.id AS "projectId", p.title, p.nickname,
            COALESCE(SUM(v.visits) FILTER (WHERE v.visit_date >= (NOW() AT TIME ZONE ${MX_TIMEZONE})::date - 6), 0)::int AS "visits7d",
            COALESCE(SUM(v.visits) FILTER (WHERE v.visit_date >= (NOW() AT TIME ZONE ${MX_TIMEZONE})::date - 29), 0)::int AS "visits30d",
            COALESCE(SUM(v.visits), 0)::int AS "totalVisits",
            p.saves_count AS "savesCount",
            p.ratings_count AS "ratingsCount"
        FROM projects p
        LEFT JOIN daily_visits v ON v.project_id = p.id
        WHERE p.owner_id = $1
        GROUP BY p.id
        ORDER BY "totalVisits" DESC
    `;
    const result = await db.query(sentence, [ownerId]);
    return result.rows;
}

module.exports = { registerProjectVisit, getDailyVisitsSeries, getProjectsVisitsBreakdown };