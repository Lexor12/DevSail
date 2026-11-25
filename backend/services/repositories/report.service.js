//Manejo de los reportes agrupados y de cada envio
const pool = require('../../config/db');
const { MX_TIMEZONE } = require('./supabase.config.js');
const { Report, ReportListItem, ReportEntry } = require('../../models/report.model');

// Columnas de la tabla de reportes para no repetirlas
const REPORT_COLUMNS = `
    id, target_type AS "targetType", project_id AS "projectId", rating_id AS "ratingId",
    status, reports_count AS "reportsCount", resolution_note AS "resolutionNote",
    resolved_by AS "resolvedBy", resolved_at AS "resolvedAt",
    created_at AS "createdAt", updated_at AS "updatedAt"
`;
// Convierte un renglon en un objeto Report
function mapReport(r) {
    return new Report(
        r.id, r.targetType, r.projectId, r.ratingId, r.status, r.reportsCount,
        r.resolutionNote, r.resolvedBy, r.resolvedAt, r.createdAt, r.updatedAt
    );
}
// Un reporte por su id o null si no existe
async function getReportById(reportId, db = pool) {
    const result = await db.query(`SELECT ${REPORT_COLUMNS} FROM reports WHERE id = $1`, [reportId]);
    return result.rows.length > 0 ? mapReport(result.rows[0]) : null;
}

// Busca un reporte pendiente del mismo contenido para agruparlos
async function getPendingReportByTarget(targetType, targetId, db = pool) {
    const column = targetType === 'project' ? 'project_id' : 'rating_id';
    const result = await db.query(
        `SELECT ${REPORT_COLUMNS} FROM reports WHERE target_type = $1 AND ${column} = $2 AND status = 'pending'`,
        [targetType, targetId]
    );
    return result.rows.length > 0 ? mapReport(result.rows[0]) : null;
}

// Revisa si el usuario ya habia reportado ese contenido
async function hasUserReportedTarget(userId, targetType, targetId, db = pool) {
    const column = targetType === 'project' ? 'r.project_id' : 'r.rating_id';
    const sentence = `
        SELECT 1
        FROM report_entries re
        JOIN reports r ON r.id = re.report_id
        WHERE re.reporter_id = $1 AND r.target_type = $2 AND ${column} = $3
        LIMIT 1
    `;
    const result = await db.query(sentence, [userId, targetType, targetId]);
    return result.rows.length > 0;
}

// Crea o suma al reporte y guarda el envio del usuario, va en una transaccion
async function addReportWithEntry(data, db = pool) {
    const existing = await getPendingReportByTarget(data.targetType, data.targetId, db);
    let reportId;

    if (existing) {
        reportId = existing.id;
        await db.query(
            `UPDATE reports SET reports_count = reports_count + 1, updated_at = NOW() WHERE id = $1`,
            [reportId]
        );
    } else {
        const projectId = data.targetType === 'project' ? data.targetId : null;
        const ratingId = data.targetType === 'comment' ? data.targetId : null;
        const inserted = await db.query(
            `INSERT INTO reports (target_type, project_id, rating_id) VALUES ($1, $2, $3) RETURNING id`,
            [data.targetType, projectId, ratingId]
        );
        reportId = inserted.rows[0].id;
    }

    await db.query(
        `INSERT INTO report_entries (report_id, reporter_id, reason_id, detail) VALUES ($1, $2, $3, $4)`,
        [reportId, data.reporterId, data.reasonId, data.detail || null]
    );
    return reportId;
}

// Reportes filtrados para el administrador
async function getReportList(filters, db = pool) {
    const conditions = ['TRUE'];
    const params = [];
    const add = (value) => {
        params.push(value);
        return `$${params.length}`;
    };

    if (filters.status) conditions.push(`r.status = ${add(filters.status)}`);
    if (filters.targetType) conditions.push(`r.target_type = ${add(filters.targetType)}`);
    if (filters.reasonId) {
        conditions.push(`EXISTS (SELECT 1 FROM report_entries re WHERE re.report_id = r.id AND re.reason_id = ${add(filters.reasonId)})`);
    }
    if (filters.dateFrom) conditions.push(`(r.created_at AT TIME ZONE ${MX_TIMEZONE})::date >= ${add(filters.dateFrom)}::date`);
    if (filters.dateTo) conditions.push(`(r.created_at AT TIME ZONE ${MX_TIMEZONE})::date <= ${add(filters.dateTo)}::date`);

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const limit = add(pageSize);
    const offset = add((page - 1) * pageSize);

    const sentence = `
        SELECT
            r.id, r.target_type AS "targetType", COALESCE(r.project_id, r.rating_id) AS "targetId",
            COALESCE(p.title, LEFT(rt.comment, 80)) AS "contentSummary",
            last_entry."lastReasonName", last_entry."lastReporterUsername",
            r.reports_count AS "reportsCount", r.status, r.created_at AS "createdAt", r.updated_at AS "updatedAt",
            COUNT(*) OVER()::int AS total
        FROM reports r
        LEFT JOIN projects p ON p.id = r.project_id
        LEFT JOIN ratings rt ON rt.id = r.rating_id
        LEFT JOIN LATERAL (
            SELECT rr.name AS "lastReasonName", u.username AS "lastReporterUsername"
            FROM report_entries re
            JOIN report_reasons rr ON rr.id = re.reason_id
            LEFT JOIN users u ON u.id = re.reporter_id
            WHERE re.report_id = r.id
            ORDER BY re.created_at DESC
            LIMIT 1
        ) last_entry ON TRUE
        WHERE ${conditions.join(' AND ')}
        ORDER BY r.updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await db.query(sentence, params);
    return {
        reports: result.rows.map(r => new ReportListItem(
            r.id, r.targetType, r.targetId, r.contentSummary, r.lastReasonName,
            r.lastReporterUsername, r.reportsCount, r.status, r.createdAt, r.updatedAt
        )),
        total: result.rows.length > 0 ? result.rows[0].total : 0
    };
}
// Envios de un reporte
async function getEntriesByReportId(reportId, db = pool) {
    const sentence = `
        SELECT re.id, re.report_id AS "reportId", re.reporter_id AS "reporterId",
        u.username AS "reporterUsername", re.reason_id AS "reasonId",
        rr.name AS "reasonName", re.detail, re.created_at AS "createdAt"
        FROM report_entries re
        JOIN report_reasons rr ON rr.id = re.reason_id
        LEFT JOIN users u ON u.id = re.reporter_id
        WHERE re.report_id = $1
        ORDER BY re.created_at DESC
    `;
    const result = await db.query(sentence, [reportId]);
    return result.rows.map(r => new ReportEntry(
        r.id, r.reportId, r.reporterId, r.reporterUsername, r.reasonId, r.reasonName, r.detail, r.createdAt
    ));
}

//Resuelve un reporte como resolved_hidden o dismissed
async function resolveReport(reportId, newStatus, resolutionNote, adminId, db = pool) {
    await db.query(
        `UPDATE reports SET status = $2, resolution_note = $3, resolved_by = $4, resolved_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [reportId, newStatus, resolutionNote, adminId]
    );
}
module.exports = {
    getReportById, getPendingReportByTarget, hasUserReportedTarget,
    addReportWithEntry, getReportList, getEntriesByReportId, resolveReport
};