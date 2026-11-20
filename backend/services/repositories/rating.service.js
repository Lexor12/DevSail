// Este archivo permite gestionar las calificaciones y comentarios de los proyectos, incluyendo la creación, actualización, eliminación y ocultamiento de comentarios por parte de administradores
const pool = require('../../config/db');
const { Rating, ProjectCommentItem } = require('../../models/rating.model');

//Este objeto contiene las columnas de la tabla ratings que se van a seleccionar en las consultas, para evitar repetir código y mantener consistencia
const RATING_COLUMNS = `
    id, project_id AS "projectId", user_id AS "userId",
    score_design AS "scoreDesign", score_usefulness AS "scoreUsefulness",
    score_code_quality AS "scoreCodeQuality", score_documentation AS "scoreDocumentation",
    score_innovation AS "scoreInnovation", average::float, comment,
    is_edited AS "isEdited", comment_hidden AS "commentHidden",
    comment_hidden_reason AS "commentHiddenReason", comment_hidden_at AS "commentHiddenAt",
    comment_hidden_by AS "commentHiddenBy", created_at AS "createdAt", updated_at AS "updatedAt"
`;

//Esta función permite mapear los resultados de la base de datos a un objeto de tipo Rating, esta como se utiliza muchas veces se hace función para evitar repetir código
function mapRating(r) {
    return new Rating(
        r.id, r.projectId, r.userId, r.scoreDesign, r.scoreUsefulness, r.scoreCodeQuality,
        r.scoreDocumentation, r.scoreInnovation, r.average, r.comment, r.isEdited,
        r.commentHidden, r.commentHiddenReason, r.commentHiddenAt, r.commentHiddenBy,
        r.createdAt, r.updatedAt
    );
}

//Permite obtener una calificación por su id, si no existe retorna null
async function getRatingById(ratingId, db = pool) {
    const result = await db.query(`SELECT ${RATING_COLUMNS} FROM ratings WHERE id = $1`, [ratingId]);
    return result.rows.length > 0 ? mapRating(result.rows[0]) : null;
}

//Permite obtener la calificación de un usuario para un proyecto específico, si no existe retorna null
async function getRatingByUserAndProject(userId, projectId, db = pool) {
    const result = await db.query(
        `SELECT ${RATING_COLUMNS} FROM ratings WHERE user_id = $1 AND project_id = $2`,
        [userId, projectId]
    );
    return result.rows.length > 0 ? mapRating(result.rows[0]) : null;
}

// Lista paginada de calificaciones/comentarios de un proyecto
async function getRatingsByProject(projectId, sortBy = 'recent', page = 1, pageSize = 10, db = pool) {
    const orderBy = sortBy === 'highest' ? 'r.average DESC, r.created_at DESC' : sortBy === 'lowest' ? 'r.average ASC, r.created_at DESC' : 'r.created_at DESC';
    const offset = (page - 1) * pageSize;

    const sentence = `
        SELECT
            r.id, r.user_id AS "userId", u.username AS "authorUsername",
            u.full_name AS "authorFullName", u.avatar_path AS "authorAvatarPath",
            r.score_design AS "scoreDesign", r.score_usefulness AS "scoreUsefulness",
            r.score_code_quality AS "scoreCodeQuality", r.score_documentation AS "scoreDocumentation",
            r.score_innovation AS "scoreInnovation", r.average::float,
            CASE WHEN r.comment_hidden THEN NULL ELSE r.comment END AS comment,
            r.is_edited AS "isEdited", r.comment_hidden AS "commentHidden",
            r.created_at AS "createdAt",
            COUNT(*) OVER()::int AS total
        FROM ratings r
        JOIN users u ON u.id = r.user_id
        WHERE r.project_id = $1
        ORDER BY ${orderBy}
        LIMIT $2 OFFSET $3
    `;
    const result = await db.query(sentence, [projectId, pageSize, offset]);
    return {
        ratings: result.rows.map(r => new ProjectCommentItem(
            r.id, r.userId, r.authorUsername, r.authorFullName, r.authorAvatarPath,
            r.scoreDesign, r.scoreUsefulness, r.scoreCodeQuality, r.scoreDocumentation,
            r.scoreInnovation, r.average, r.comment, r.isEdited, r.commentHidden, r.createdAt
        )),
        total: result.rows.length > 0 ? result.rows[0].total : 0
    };
}

// Ids de todos los proyectos que califico un usuario (sirve para recalcular promedios al eliminar cuenta)
async function getProjectIdsRatedByUser(userId, db = pool) {
    const result = await db.query(`SELECT DISTINCT project_id AS "projectId" FROM ratings WHERE user_id = $1`, [userId]);
    return result.rows.map(r => r.projectId);
}
//Permite crear una nueva calificación para un proyecto, retorna el id de la nueva calificación
async function createRating(data, db = pool) {
    const average = (
        data.scoreDesign + data.scoreUsefulness + data.scoreCodeQuality +
        data.scoreDocumentation + data.scoreInnovation
    ) / 5.0;

    const sentence = `
        INSERT INTO ratings (
            project_id, user_id, score_design, score_usefulness, score_code_quality,
            score_documentation, score_innovation, average, comment
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
    `;
    const result = await db.query(sentence, [
        data.projectId, data.userId, data.scoreDesign, data.scoreUsefulness,
        data.scoreCodeQuality, data.scoreDocumentation, data.scoreInnovation,
        average, data.comment || null
    ]);
    return result.rows[0].id;
}

//Permite actualizar una calificación existente, recalculando el promedio y marcando como editado
async function updateRating(ratingId, data, db = pool) {
    const average = (
        data.scoreDesign + data.scoreUsefulness + data.scoreCodeQuality +
        data.scoreDocumentation + data.scoreInnovation
    ) / 5.0;

    const sentence = `
        UPDATE ratings SET
            score_design = $2, score_usefulness = $3, score_code_quality = $4,
            score_documentation = $5, score_innovation = $6, average = $7,
            comment = $8, is_edited = TRUE, updated_at = NOW()
        WHERE id = $1
    `;
    await db.query(sentence, [
        ratingId, data.scoreDesign, data.scoreUsefulness, data.scoreCodeQuality,
        data.scoreDocumentation, data.scoreInnovation, average, data.comment || null
    ]);
}
//Permite eliminar una calificación existente
async function deleteRating(ratingId, db = pool) {
    await db.query(`DELETE FROM ratings WHERE id = $1`, [ratingId]);
}

// El administrador oculta el texto del comentario, pero la calificacion numerica sigue contando 
async function hideRatingComment(ratingId, reason, adminId, db = pool) {
    await db.query(
        `UPDATE ratings SET comment_hidden = TRUE, comment_hidden_reason = $2, comment_hidden_at = NOW(), comment_hidden_by = $3 WHERE id = $1`,
        [ratingId, reason, adminId]
    );
}
// El administrador muestra nuevamente el texto del comentario
async function showRatingComment(ratingId, db = pool) {
    await db.query(
        `UPDATE ratings SET comment_hidden = FALSE, comment_hidden_reason = NULL, comment_hidden_at = NULL, comment_hidden_by = NULL WHERE id = $1`,
        [ratingId]
    );
}

// Exportamos las funciones para que puedan ser usadas en otros archivos
module.exports = {
    getRatingById, getRatingByUserAndProject, getRatingsByProject, getProjectIdsRatedByUser,
    createRating, updateRating, deleteRating, hideRatingComment, showRatingComment
};