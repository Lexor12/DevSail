// Relacion entre proyectos y tecnologias, maximo 5 por proyecto
const pool = require('../../config/db');
const { Technology } = require('../../models/catalog.model');

async function getTechnologiesByProject(projectId, db = pool) {
    const sentence = `
        SELECT t.id, t.name
        FROM project_technologies x
        JOIN technologies t ON t.id = x.technology_id
        WHERE x.project_id = $1
        ORDER BY t.name
    `;
    const result = await db.query(sentence, [projectId]);
    return result.rows.map(r => new Technology(r.id, r.name));
}

// Reemplaza las tecnologias de un proyecto, se usa dentro de una transaccion
async function setProjectTechnologies(projectId, technologyIds, db = pool) {
    await db.query(`DELETE FROM project_technologies WHERE project_id = $1`, [projectId]);
    if (technologyIds.length > 0) {
        await db.query(
            `INSERT INTO project_technologies (project_id, technology_id) SELECT $1, UNNEST($2::uuid[])`,
            [projectId, technologyIds]
        );
    }
}

module.exports = { getTechnologiesByProject, setProjectTechnologies };