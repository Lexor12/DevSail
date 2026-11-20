// Este archivo contiene las funciones que se usan para mostrar valores en el panel del administrador, como el resumen de reportes 
// pendientes, proyectos ocultos, comentarios ocultos, proyectos destacados activos, planes pro activos y el ingreso del mes actual. 
// También permite obtener listas filtradas de proyectos y comentarios para su gestión.
const pool = require('../../config/db');
const { MX_TIMEZONE } = require('./supabase.config.js');
const { DashboardSummary, AdminProject, AdminComment } = require('../../models/admin.model');

// Esta función obtiene un resumen de métricas para el panel del administrador, incluyendo reportes pendientes, proyectos ocultos, comentarios ocultos, proyectos destacados activos, planes pro activos y el ingreso del mes actual.
async function getDashboardSummary(db = pool) {
    const sentence = `
        SELECT
            (SELECT COUNT(*)::int FROM reports WHERE status = 'pending') AS "pendingReports",
            (SELECT COUNT(*)::int FROM projects WHERE status = 'hidden') AS "hiddenProjects",
            (SELECT COUNT(*)::int FROM ratings WHERE comment_hidden = TRUE) AS "hiddenComments",
            (SELECT COUNT(DISTINCT project_id)::int FROM featured_projects WHERE status = 'active' AND starts_at <= NOW() AND ends_at > NOW()) AS "activeFeatured",
            (SELECT COUNT(DISTINCT user_id)::int FROM pro_subscriptions WHERE status = 'active' AND starts_at <= NOW() AND ends_at > NOW()) AS "activeProPlans",
            (SELECT COALESCE(SUM(amount), 0)::float FROM payments
            WHERE status = 'completed'
            AND (completed_at AT TIME ZONE ${MX_TIMEZONE}) >= DATE_TRUNC('month', NOW() AT TIME ZONE ${MX_TIMEZONE})) AS "monthIncome"
    `;
    const r = (await db.query(sentence)).rows[0];
    return new DashboardSummary(
        r.pendingReports, r.hiddenProjects, r.hiddenComments,
        r.activeFeatured, r.activeProPlans, r.monthIncome
    );
}
// Esta función obtiene una lista de proyectos filtrados para el panel del administrador, incluyendo información sobre el propietario, estado, calificación promedio, cantidad de reportes pendientes y fecha de publicación.
async function getAdminProjects(filters, db = pool) {
    const conditions = ['TRUE'];
    const params = [];
    const add = (value) => {
        params.push(value);
        return `$${params.length}`;
    };

    if (filters.status) conditions.push(`p.status = ${add(filters.status)}`);
    if (filters.text) {
        const like = add(`%${filters.text}%`);
        conditions.push(`(p.title ILIKE ${like} OR p.nickname ILIKE ${like} OR u.username ILIKE ${like})`);
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const limit = add(pageSize);
    const offset = add((page - 1) * pageSize);

    const sentence = `
        SELECT
            p.id, p.title, p.nickname, u.username AS "ownerUsername", p.status,
            p.hidden_reason AS "hiddenReason", p.avg_overall::float AS "avgOverall",
            p.ratings_count AS "ratingsCount",
            (SELECT COALESCE(SUM(r.reports_count), 0)::int FROM reports r WHERE r.project_id = p.id AND r.status = 'pending') AS "pendingReports",
            p.published_at AS "publishedAt",
            COUNT(*) OVER()::int AS total
        FROM projects p
        JOIN users u ON u.id = p.owner_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY p.published_at DESC
        LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await db.query(sentence, params);
    return {
        projects: result.rows.map(r => new AdminProject(
            r.id, r.title, r.nickname, r.ownerUsername, r.status, r.hiddenReason,
            r.avgOverall, r.ratingsCount, r.pendingReports, r.publishedAt
        )),
        total: result.rows.length > 0 ? result.rows[0].total : 0
    };
}

// Esta función obtiene una lista de comentarios filtrados para el panel del administrador, incluyendo información sobre el proyecto, autor, estado y fecha de creación.
async function getAdminComments(filters, db = pool) {
    const conditions = ['r.comment IS NOT NULL'];
    const params = [];
    const add = (value) => {
        params.push(value);
        return `$${params.length}`;
    };
    // Filtros opcionales
    if (typeof filters.hidden === 'boolean') conditions.push(`r.comment_hidden = ${add(filters.hidden)}`);

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const limit = add(pageSize);
    const offset = add((page - 1) * pageSize);

    const sentence = `
        SELECT
            r.id, r.project_id AS "projectId", p.nickname AS "projectNickname",
            u.username AS "authorUsername", r.comment, r.comment_hidden AS "commentHidden",
            r.comment_hidden_reason AS "hiddenReason", r.created_at AS "createdAt",
            COUNT(*) OVER()::int AS total
        FROM ratings r
        JOIN projects p ON p.id = r.project_id
        JOIN users u ON u.id = r.user_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await db.query(sentence, params);
    return {
        comments: result.rows.map(r => new AdminComment(
            r.id, r.projectId, r.projectNickname, r.authorUsername,
            r.comment, r.commentHidden, r.hiddenReason, r.createdAt
        )),
        total: result.rows.length > 0 ? result.rows[0].total : 0
    };
}
// Exportamos las funciones para que puedan ser usadas en otros archivos
module.exports = { getDashboardSummary, getAdminProjects, getAdminComments };