// Estadisticas publicas del perfil de un usuario
const pool = require('../../config/db');
const { ProfileStats } = require('../../models/profileStats.model');

// Junta proyectos publicados, promedio, calificaciones recibidas y dadas,
// guardados, el mejor proyecto y las tecnologias mas usadas
async function getProfileStats(userId, db = pool) {
    const countsSentence = `
        SELECT
            (SELECT COUNT(*)::int FROM projects WHERE owner_id = $1 AND status = 'published') AS "publishedProjects",
            (SELECT ROUND(AVG(r.average), 1)::float
            FROM ratings r JOIN projects p ON p.id = r.project_id
            WHERE p.owner_id = $1 AND p.status = 'published') AS "avgRating",
            (SELECT COUNT(*)::int FROM ratings r JOIN projects p ON p.id = r.project_id
            WHERE p.owner_id = $1 AND p.status = 'published') AS "ratingsReceived",
            (SELECT COALESCE(SUM(saves_count), 0)::int FROM projects
            WHERE owner_id = $1 AND status = 'published') AS "savesReceived",
            (SELECT COUNT(*)::int FROM ratings WHERE user_id = $1) AS "ratingsGiven"
    `;
    
    const bestSentence = `
        SELECT id, title, nickname, avg_overall::float AS "avgOverall"
        FROM projects
        WHERE owner_id = $1 AND status = 'published' AND ratings_count > 0
        ORDER BY avg_overall DESC, ratings_count DESC
        LIMIT 1
    `;

    const technologiesSentence = `
        SELECT t.name
        FROM project_technologies x
        JOIN projects p ON p.id = x.project_id
        JOIN technologies t ON t.id = x.technology_id
        WHERE p.owner_id = $1 AND p.status = 'published'
        GROUP BY t.name
        ORDER BY COUNT(*) DESC, t.name ASC
        LIMIT 5
    `;

    const [counts, best, technologies] = await Promise.all([
        db.query(countsSentence, [userId]),// Las tres consultas corren en paralelo para que sea mas rapido
        db.query(bestSentence, [userId]),
        db.query(technologiesSentence, [userId])
    ]);

    const c = counts.rows[0];// La consulta de conteos solo regresa un renglon
    return new ProfileStats(
        c.publishedProjects, c.avgRating, c.ratingsReceived, c.savesReceived, c.ratingsGiven,
        best.rows.length > 0 ? best.rows[0] : null,
        technologies.rows.map(r => r.name)
    );
}
module.exports = { getProfileStats };