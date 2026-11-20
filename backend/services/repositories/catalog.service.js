// Este archivo permite obtener los tipos de proyectos, tecnologias y razones de reporte del catalogo de la base de datos
//Estos son usados por varias secciones del frontend, para agregar proyectos, para buscar, etc, son catalogos que no cambian con frecuencia y son usados en varias partes del sistema
const pool = require('../../config/db');
const { ProjectType, Technology, ReportReason } = require('../../models/catalog.model');

//Esta función permite obtener todos los tipos de proyectos del catálogo que se pueden tener
async function getAllProjectTypes(db = pool) {
    const result = await db.query(`SELECT id, code, name, sort_order AS "sortOrder" FROM project_types ORDER BY sort_order`);
    return result.rows.map(r => new ProjectType(r.id, r.code, r.name, r.sortOrder));
}

//Esta función permite obtener un tipo de proyecto por su id, si no existe retorna null
async function getProjectTypeById(typeId, db = pool) {
    const result = await db.query(`SELECT id, code, name, sort_order AS "sortOrder" FROM project_types WHERE id = $1`, [typeId]);
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return new ProjectType(r.id, r.code, r.name, r.sortOrder);
}

//Esta función permite obtener todas las tecnologias del catalogo que se pueden tener
async function getAllTechnologies(db = pool) {
    const result = await db.query(`SELECT id, name FROM technologies ORDER BY name`);
    return result.rows.map(r => new Technology(r.id, r.name));
}

// Verifica que todos los UUID de tecnologias enviados existan realmente en el catalogo
async function countExistingTechnologies(technologyIds, db = pool) {
    const result = await db.query(
        `SELECT COUNT(*)::int AS total FROM technologies WHERE id = ANY($1::uuid[])`,
        [technologyIds]
    );
    //Analizamos cuantos de los ids de tecnologias enviados existen en el catalogo, si el total es menor al total de ids enviados, entonces hay ids que no existen
    return result.rows[0].total;
}
//Permite obtener todos los motivos de reporte del catalogo que se pueden tener
async function getAllReportReasons(db = pool) {
    const result = await db.query(
        `SELECT id, code, name, requires_detail AS "requiresDetail", sort_order AS "sortOrder" FROM report_reasons ORDER BY sort_order`
    );
    return result.rows.map(r => new ReportReason(r.id, r.code, r.name, r.requiresDetail, r.sortOrder));
}

//Permite obtener un motivo de reporte por su id, si no existe retorna null
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