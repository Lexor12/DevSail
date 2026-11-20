// Consultas y operaciones de la tabla projects
const pool = require('../../config/db');
const { Project, ProjectDetail, OwnerProject,ProjectCard } = require('../../models/project.model');

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

const PROJECT_COLUMNS = `
    id, owner_id AS "ownerId", project_type_id AS "projectTypeId", title, nickname, description,
    repository_url AS "repositoryUrl", repository_platform AS "repositoryPlatform", demo_url AS "demoUrl",
    seeking_feedback AS "seekingFeedback", open_to_collaborate AS "openToCollaborate",
    authorship_declared AS "authorshipDeclared", status, hidden_reason AS "hiddenReason",
    hidden_at AS "hiddenAt", hidden_by AS "hiddenBy", deactivated_at AS "deactivatedAt",
    avg_design::float AS "avgDesign", avg_usefulness::float AS "avgUsefulness",
    avg_code_quality::float AS "avgCodeQuality", avg_documentation::float AS "avgDocumentation",
    avg_innovation::float AS "avgInnovation", avg_overall::float AS "avgOverall",
    ratings_count AS "ratingsCount", saves_count AS "savesCount",
    published_at AS "publishedAt", updated_at AS "updatedAt"
`;

function mapProject(r) {
    return new Project(
        r.id, r.ownerId, r.projectTypeId, r.title, r.nickname, r.description, r.repositoryUrl,
        r.repositoryPlatform, r.demoUrl, r.seekingFeedback, r.openToCollaborate,
        r.authorshipDeclared, r.status, r.hiddenReason, r.hiddenAt, r.hiddenBy,
        r.deactivatedAt, r.avgDesign, r.avgUsefulness, r.avgCodeQuality,
        r.avgDocumentation, r.avgInnovation, r.avgOverall, r.ratingsCount,
        r.savesCount, r.publishedAt, r.updatedAt
    );
}

//Permite crear un proyecto nuevo, retorna el id del proyecto creado
async function createProject(data, db = pool) {
    const sentence = `
        INSERT INTO projects (
            owner_id, project_type_id, title, nickname, description, repository_url,
            repository_platform, demo_url, seeking_feedback, open_to_collaborate, authorship_declared
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
    `;
    const result = await db.query(sentence, [
        data.ownerId, data.projectTypeId, data.title, data.nickname, data.description,
        data.repositoryUrl, data.repositoryPlatform, data.demoUrl,
        data.seekingFeedback, data.openToCollaborate, data.authorshipDeclared
    ]);
    return result.rows[0].id;
}

// Permite actualizar un proyecto existente, no retorna nada
async function updateProject(projectId, data, db = pool) {
    const sentence = `
        UPDATE projects SET
            project_type_id = $2, title = $3, nickname = $4, description = $5,
            repository_url = $6, repository_platform = $7, demo_url = $8,
            seeking_feedback = $9, open_to_collaborate = $10, updated_at = NOW()
        WHERE id = $1
    `;
    await db.query(sentence, [
        projectId, data.projectTypeId, data.title, data.nickname, data.description,
        data.repositoryUrl, data.repositoryPlatform, data.demoUrl,
        data.seekingFeedback, data.openToCollaborate
    ]);
}

//Permite cambiar el estado de un proyecto entre: 'published', 'deactivated' o 'hidden'
async function setProjectStatus(projectId, status, options = {}, db = pool) {
    if (status === 'hidden') {
        await db.query(
            `UPDATE projects SET status = 'hidden', hidden_reason = $2, hidden_at = NOW(), hidden_by = $3, updated_at = NOW() WHERE id = $1`,
            [projectId, options.hiddenReason, options.hiddenBy]
        );
        return;
    }
    if (status === 'deactivated') {
        await db.query(
            `UPDATE projects SET status = 'deactivated', deactivated_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [projectId]
        );
        return;
    }
    // Al reactivar o volver a mostrar se limpian las marcas de ocultamiento/desactivacion
    await db.query(
        `UPDATE projects SET status = 'published', hidden_reason = NULL, hidden_at = NULL, hidden_by = NULL, deactivated_at = NULL, updated_at = NOW() WHERE id = $1`,
        [projectId]
    );
}

// Desactiva en lote los proyectos excedentes cuando vence el Plan Pro
async function deactivateProjectsBatch(projectIds, db = pool) {
    if (projectIds.length === 0) return;
    await db.query(
        `UPDATE projects SET status = 'deactivated', deactivated_at = NOW(), updated_at = NOW() WHERE id = ANY($1::uuid[])`,
        [projectIds]
    );
}
// Permite eliminar un proyecto 
async function deleteProject(projectId, db = pool) {
    await db.query(`DELETE FROM projects WHERE id = $1`, [projectId]);
}

//Permite obtener un proyecto por su id, si no existe retorna null
async function getProjectById(projectId, db = pool) {
    const result = await db.query(`SELECT ${PROJECT_COLUMNS} FROM projects WHERE id = $1`, [projectId]);
    return result.rows.length > 0 ? mapProject(result.rows[0]) : null;
}

//Permite obtener un proyecto por su url de repositorio, si no existe retorna null
async function getProjectByRepositoryUrl(repositoryUrl, db = pool) {
    const result = await db.query(`SELECT ${PROJECT_COLUMNS} FROM projects WHERE repository_url = $1`, [repositoryUrl]);
    return result.rows.length > 0 ? mapProject(result.rows[0]) : null;
}
//Permite obtener los detalles de un producto según su Id
async function getProjectDetailById(projectId, db = pool) {
    const sentence = `
        SELECT
            p.id, p.owner_id AS "ownerId", u.username AS "ownerUsername",
            u.full_name AS "ownerFullName", u.avatar_path AS "ownerAvatarPath",
            p.project_type_id AS "projectTypeId", pt.code AS "typeCode", pt.name AS "typeName",
            p.title, p.nickname, p.description, p.repository_url AS "repositoryUrl",
            p.repository_platform AS "repositoryPlatform", p.demo_url AS "demoUrl",
            p.status, p.hidden_reason AS "hiddenReason",
            p.seeking_feedback AS "seekingFeedback", p.open_to_collaborate AS "openToCollaborate",
            p.avg_design::float AS "avgDesign", p.avg_usefulness::float AS "avgUsefulness",
            p.avg_code_quality::float AS "avgCodeQuality", p.avg_documentation::float AS "avgDocumentation",
            p.avg_innovation::float AS "avgInnovation", p.avg_overall::float AS "avgOverall",
            p.ratings_count AS "ratingsCount", p.saves_count AS "savesCount",
            ${FEATURED_CONDITION} AS "isFeatured",
            p.published_at AS "publishedAt"
        FROM projects p
        JOIN users u ON u.id = p.owner_id
        JOIN project_types pt ON pt.id = p.project_type_id
        WHERE p.id = $1
    `;
    const result = await db.query(sentence, [projectId]);
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return new ProjectDetail(
        r.id, r.ownerId, r.ownerUsername, r.ownerFullName, r.ownerAvatarPath,
        r.projectTypeId, r.typeCode, r.typeName, r.title, r.nickname, r.description,
        r.repositoryUrl, r.repositoryPlatform, r.demoUrl, r.status, r.hiddenReason,
        r.seekingFeedback, r.openToCollaborate, r.avgDesign, r.avgUsefulness,
        r.avgCodeQuality, r.avgDocumentation, r.avgInnovation, r.avgOverall,
        r.ratingsCount, r.savesCount, r.isFeatured, r.publishedAt
    );
}

// Recalcula promedios por criterio, promedio general y total de calificaciones en la misma transaccion
async function recalculateProjectRatings(projectId, db = pool) {
    const sentence = `
        UPDATE projects p SET
            avg_design        = sub.avg_design,
            avg_usefulness    = sub.avg_usefulness,
            avg_code_quality  = sub.avg_code_quality,
            avg_documentation = sub.avg_documentation,
            avg_innovation    = sub.avg_innovation,
            avg_overall       = sub.avg_overall,
            ratings_count     = sub.ratings_count
        FROM (
            SELECT
                ROUND(AVG(score_design), 2)        AS avg_design,
                ROUND(AVG(score_usefulness), 2)    AS avg_usefulness,
                ROUND(AVG(score_code_quality), 2)  AS avg_code_quality,
                ROUND(AVG(score_documentation), 2) AS avg_documentation,
                ROUND(AVG(score_innovation), 2)    AS avg_innovation,
                ROUND(AVG(average), 2)             AS avg_overall,
                COUNT(*)::int                      AS ratings_count
            FROM ratings
            WHERE project_id = $1
        ) sub
        WHERE p.id = $1
    `;
    await db.query(sentence, [projectId]);
}

// Actualiza el contador denormalizado saves_count en projects
async function recalculateProjectSaves(projectId, db = pool) {
    await db.query(
        `UPDATE projects SET saves_count = (SELECT COUNT(*)::int FROM saved_projects WHERE project_id = $1) WHERE id = $1`,
        [projectId]
    );
}

//Esta función permite contar cuantos proyectos publicados tiene un usuario, para poder limitar la cantidad de proyectos que puede tener un usuario sin Plan Pro
async function countPublishedProjectsByOwner(ownerId, db = pool) {
    const result = await db.query(
        `SELECT COUNT(*)::int AS total FROM projects WHERE owner_id = $1 AND status = 'published'`,
        [ownerId]
    );
    return result.rows[0].total;
}

//Esta función retorna todos los proyectos de un usuario, incluyendo los desactivados y ocultos, ordenados por fecha de publicación descendente, para poder mostrar la lista de proyectos del usuario en su perfil
async function getProjectsByOwner(ownerId, db = pool) {
    const sentence = `
        SELECT
            p.id, p.title, p.nickname, p.status, p.hidden_reason AS "hiddenReason",
            (SELECT i.storage_path FROM project_images i WHERE i.project_id = p.id ORDER BY i.position LIMIT 1) AS "coverPath",
            p.avg_overall::float AS "avgOverall", p.ratings_count AS "ratingsCount", p.saves_count AS "savesCount",
            COALESCE((SELECT SUM(v.visits) FROM daily_visits v WHERE v.project_id = p.id), 0)::int AS "totalVisits",
            (SELECT MAX(f.ends_at) FROM featured_projects f
            WHERE f.project_id = p.id AND f.status = 'active' AND f.starts_at <= NOW() AND f.ends_at > NOW()) AS "featuredEndsAt",
            p.published_at AS "publishedAt"
        FROM projects p
        WHERE p.owner_id = $1
        ORDER BY p.published_at DESC
    `;
    const result = await db.query(sentence, [ownerId]);
    return result.rows.map(r => new OwnerProject(
        r.id, r.title, r.nickname, r.status, r.hiddenReason, r.coverPath, r.avgOverall,
        r.ratingsCount, r.savesCount, r.totalVisits, r.featuredEndsAt, r.publishedAt
    ));
}

//Esta función retorna todos los proyectos publicados de un usuario, ordenados por fecha de publicación descendente, para poder mostrar la lista de proyectos del usuario en su perfil
async function getPublishedProjectsByOwner(ownerId, sortBy = 'recent', db = pool) {
    const orderBy = sortBy === 'rated' ? 'p.avg_overall DESC NULLS LAST, p.ratings_count DESC' : 'p.published_at DESC';
    const result = await db.query(
        `SELECT ${CARD_SELECT} ${CARD_FROM} WHERE p.owner_id = $1 AND p.status = 'published' ORDER BY ${orderBy}`,
        [ownerId]
    );
    return result.rows.map(mapProjectCard);
}


//Esta función permite obtener una lista de proyectos destacados, ordenados aleatoriamente, con un limite de cantidad de proyectos a retornar, estos se muestran en la pagina principal del frontend
async function getFeaturedProjects(limit, db = pool) {
    const result = await db.query(
        `SELECT ${CARD_SELECT} ${CARD_FROM} WHERE p.status = 'published' AND ${FEATURED_CONDITION} ORDER BY random() LIMIT $1`,
        [limit]
    );
    return result.rows.map(mapProjectCard);
}

//Otra función que se llama desde el frontend, que permite obtener los proyectos mejor calificados en un periodo de tiempo, con un minimo de calificaciones y un limite de cantidad de proyectos a retornar, estos se muestran en la pagina principal del frontend
async function getTopRatedProjects(days, minRatings, limit, db = pool) {
    const sentence = `
        SELECT ${CARD_SELECT}
        ${CARD_FROM}
        JOIN (
            SELECT project_id, AVG(average) AS period_avg, COUNT(*) AS period_count
            FROM ratings
            WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
            GROUP BY project_id
            HAVING COUNT(*) >= $2
        ) period ON period.project_id = p.id
        WHERE p.status = 'published'
        ORDER BY period.period_avg DESC, period.period_count DESC
        LIMIT $3
    `;
    const result = await db.query(sentence, [days, minRatings, limit]);
    return result.rows.map(mapProjectCard);
}

//Permite obtener los proyectos mas recientes publicados, con un limite de cantidad de proyectos a retornar
async function getLatestProjects(limit, db = pool) {
    const result = await db.query(
        `SELECT ${CARD_SELECT} ${CARD_FROM} WHERE p.status = 'published' ORDER BY p.published_at DESC LIMIT $1`,
        [limit]
    );
    return result.rows.map(mapProjectCard);
}

function escapeLike(text) {
    return text.replace(/[\\%_]/g, '\\$&');
}

const SORTS = {
    recent: 'p.published_at DESC',
    rated: 'p.avg_overall DESC NULLS LAST, p.ratings_count DESC',
    saved: 'p.saves_count DESC, p.published_at DESC'
};

// Busqueda combinada con filtros, orden y paginacion
async function searchProjects(filters, db = pool) {
    const conditions = [`p.status = 'published'`];
    const params = [];
    const add = (value) => {
        params.push(value);
        return `$${params.length}`;
    };

    if (filters.text) {
        const like = add(`%${escapeLike(filters.text)}%`);
        conditions.push(`(unaccent(p.title) ILIKE unaccent(${like}) OR unaccent(p.nickname) ILIKE unaccent(${like}) OR unaccent(p.description) ILIKE unaccent(${like}))`);
    }
    if (filters.typeCode) {
        conditions.push(`pt.code = ${add(filters.typeCode)}`);
    }
    if (filters.technologyIds && filters.technologyIds.length > 0) {
        const ids = add(filters.technologyIds);
        conditions.push(`(SELECT COUNT(DISTINCT x.technology_id) FROM project_technologies x WHERE x.project_id = p.id AND x.technology_id = ANY(${ids}::uuid[])) = ${filters.technologyIds.length}`);
    }

    const minRating = filters.minRating ?? 0;
    const maxRating = filters.maxRating ?? 5;
    if (minRating > 0 || maxRating < 5) {
        const min = add(minRating);
        const max = add(maxRating);
        conditions.push(minRating === 0 ? `(p.avg_overall IS NULL OR p.avg_overall BETWEEN ${min} AND ${max})` : `p.avg_overall BETWEEN ${min} AND ${max}`);
    }

    if (filters.seekingFeedback) conditions.push(`p.seeking_feedback = TRUE`);
    if (filters.openToCollaborate) conditions.push(`p.open_to_collaborate = TRUE`);
    if (filters.hasDemo) conditions.push(`p.demo_url IS NOT NULL`);
    if (filters.onlyFeatured) conditions.push(FEATURED_CONDITION);

    const orderBy = SORTS[filters.sortBy] || SORTS.recent;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 12;
    const limit = add(pageSize);
    const offset = add((page - 1) * pageSize);

    const sentence = `
        SELECT ${CARD_SELECT}, COUNT(*) OVER()::int AS total
        ${CARD_FROM}
        WHERE ${conditions.join(' AND ')}
        ORDER BY "isFeatured" DESC, ${orderBy}
        LIMIT ${limit} OFFSET ${offset}
    `;
    const result = await db.query(sentence, params);
    return {
        projects: result.rows.map(mapProjectCard),
        total: result.rows.length > 0 ? result.rows[0].total : 0
    };
}

// Proyectos publicados que exceden el limite gratuito (3) en cuentas sin Plan Pro y sin destacado vigente 
async function getProjectIdsToAutoDeactivate(freeLimit, db = pool) {
    const sentence = `
        SELECT ranked.id
        FROM (
            SELECT p.id, p.owner_id, ROW_NUMBER() OVER (PARTITION BY p.owner_id ORDER BY p.published_at ASC) AS position
            FROM projects p
            WHERE p.status = 'published'
        ) ranked
        WHERE ranked.position > $1 AND NOT EXISTS (SELECT 1 FROM pro_subscriptions s WHERE s.user_id = ranked.owner_id AND s.status = 'active' AND s.starts_at <= NOW() AND s.ends_at > NOW())
            AND NOT EXISTS (
            SELECT 1 FROM featured_projects f
            WHERE f.project_id = ranked.id AND f.status = 'active' AND f.starts_at <= NOW() AND f.ends_at > NOW()
        )
    `;
    const result = await db.query(sentence, [freeLimit]);
    return result.rows.map(r => r.id);
}

// Exportamos las funciones para que puedan ser usadas en otros archivos
module.exports = {
    createProject, updateProject, setProjectStatus, deactivateProjectsBatch, deleteProject,
    getProjectById, getProjectByRepositoryUrl, getProjectDetailById,
    recalculateProjectRatings, recalculateProjectSaves,
    countPublishedProjectsByOwner, getProjectsByOwner, getPublishedProjectsByOwner,
    getFeaturedProjects, getTopRatedProjects, getLatestProjects, searchProjects,
    getProjectIdsToAutoDeactivate
};