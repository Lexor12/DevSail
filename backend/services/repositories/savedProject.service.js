// Esta clase permite gestionar toda la lista de proyectos guardados por un usuario en su perfil
const pool = require('../../config/db');
const {ProjectCard}=require('../../models/project.model');


// Condicion: el proyecto tiene un destacado activo justo ahora
const FEATURED_CONDITION = `EXISTS (
    SELECT 1 FROM featured_projects f
    WHERE f.project_id = p.id
    AND f.status = 'active'
    AND f.starts_at <= NOW()
    AND f.ends_at > NOW()
)`;
// Columnas de una tarjeta con alias en camelCase entre comillas dobles para que pg respete mayusculas
const CARD_SELECT = `
    p.id,
    p.title,
    p.nickname,
    pt.code AS "typeCode",
    pt.name AS "typeName",
    (SELECT i.storage_path FROM project_images i WHERE i.project_id = p.id ORDER BY i.position LIMIT 1) AS "coverPath",
    p.avg_overall::float AS "avgOverall",
    p.ratings_count AS "ratingsCount",
    p.seeking_feedback AS "seekingFeedback",
    p.open_to_collaborate AS "openToCollaborate",
    ${FEATURED_CONDITION} AS "isFeatured",
    ARRAY(
        SELECT t.name FROM project_technologies x
        JOIN technologies t ON t.id = x.technology_id
        WHERE x.project_id = p.id
        ORDER BY t.name
    ) AS technologies,
    p.saves_count AS "savesCount",
    p.published_at AS "publishedAt"
`;


const CARD_FROM = `FROM projects p JOIN project_types pt ON pt.id = p.project_type_id`;

function mapProjectCard(r) {
    return new ProjectCard(
        r.id, r.title, r.nickname, r.typeCode, r.typeName, r.coverPath,
        r.avgOverall, r.ratingsCount, r.seekingFeedback, r.openToCollaborate,
        r.isFeatured, r.technologies, r.savesCount, r.publishedAt
    );
}
//Comprobamos que efectivamente un proyecto si este guardado por un usuario,
async function isProjectSavedByUser(userId, projectId, db = pool) {
    const result = await db.query(
        `SELECT 1 FROM saved_projects WHERE user_id = $1 AND project_id = $2`,
        [userId, projectId]
    );
    return result.rows.length > 0;
}

//Permite guardar un proyecto en la lista de guardados del usuario, si ya estaba guardado no hace nada
async function saveProject(userId, projectId, db = pool) {
    await db.query(
        `INSERT INTO saved_projects (user_id, project_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, projectId]
    );
}

//Permite eliminar un proyecto de la lista de guardados del usuario
async function unsaveProject(userId, projectId, db = pool) {
    await db.query(`DELETE FROM saved_projects WHERE user_id = $1 AND project_id = $2`, [userId, projectId]);
}

// Lista de guardados del usuario: solo muestra proyectos publicados (no ocultos por otros usuarios)
async function getSavedProjectsByUser(userId, sortBy = 'recent', db = pool) {
    const orderBy = sortBy === 'rated'
        ? 'p.avg_overall DESC NULLS LAST, p.ratings_count DESC'
        : 's.created_at DESC';

    const sentence = `
        SELECT ${CARD_SELECT}
        ${CARD_FROM}
        JOIN saved_projects s ON s.project_id = p.id
        WHERE s.user_id = $1 AND p.status = 'published'
        ORDER BY ${orderBy}
    `;
    const result = await db.query(sentence, [userId]);
    return result.rows.map(mapProjectCard);
}
// Exportamos las funciones para que puedan ser usadas en otros archivos
module.exports = { isProjectSavedByUser, saveProject, unsaveProject, getSavedProjectsByUser };