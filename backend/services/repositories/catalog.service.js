// Obtiene los tipos de proyecto, tecnologias y motivos de reporte
//Se usan en varias partes del frontend y casi nunca cambian
const pool = require('../../config/db');
const { ProjectType, Technology, ReportReason } = require('../../models/catalog.model');

//Todos los tipos de proyecto
async function getAllProjectTypes(db = pool) {
    const result = await db.query(`SELECT id, code, name, sort_order AS "sortOrder" FROM project_types ORDER BY sort_order`);
    return result.rows.map(r => new ProjectType(r.id, r.code, r.name, r.sortOrder));
}

//Un tipo de proyecto por su id o null si no existe
async function getProjectTypeById(typeId, db = pool) {
    const result = await db.query(`SELECT id, code, name, sort_order AS "sortOrder" FROM project_types WHERE id = $1`, [typeId]);
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return new ProjectType(r.id, r.code, r.name, r.sortOrder);
}

//Todas las tecnologias
async function getAllTechnologies(db = pool) {
    const result = await db.query(`SELECT id, name FROM technologies ORDER BY name`);
    return result.rows.map(r => new Technology(r.id, r.name));
}

// Revisa que las tecnologias enviadas existan en el catalogo
async function countExistingTechnologies(technologyIds, db = pool) {
    const result = await db.query(
        `SELECT COUNT(*)::int AS total FROM technologies WHERE id = ANY($1::uuid[])`,
        [technologyIds]
    );
    //Si encontramos menos de las que mandaron es que alguna no existe
    return result.rows[0].total;
}
//Todos los motivos de reporte
async function getAllReportReasons(db = pool) {
    const result = await db.query(
        `SELECT id, code, name, requires_detail AS "requiresDetail", sort_order AS "sortOrder" FROM report_reasons ORDER BY sort_order`
    );
    return result.rows.map(r => new ReportReason(r.id, r.code, r.name, r.requiresDetail, r.sortOrder));
}

//Un motivo por su id o null si no existe
async function getReportReasonById(reasonId, db = pool) {
    const result = await db.query(
        `SELECT id, code, name, requires_detail AS "requiresDetail", sort_order AS "sortOrder" FROM report_reasons WHERE id = $1`,
        [reasonId]
    );
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return new ReportReason(r.id, r.code, r.name, r.requiresDetail, r.sortOrder);
}

module.exports = {
    getAllProjectTypes, getProjectTypeById, getAllTechnologies,
    countExistingTechnologies, getAllReportReasons, getReportReasonById
};