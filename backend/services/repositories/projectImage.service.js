//Maneja las imagenes de los proyectos, se guardan en Supabase Storage con su ruta y posicion
//Importamos el pool de conexiones para las consultas
const pool = require('../../config/db');
const { ProjectImage } = require('../../models/projectImage.model');

const IMAGE_COLUMNS = `id, project_id AS "projectId", storage_path AS "storagePath", position, created_at AS "createdAt"`;

function mapImage(r) {
    return new ProjectImage(r.id, r.projectId, r.storagePath, r.position, r.createdAt);
}

//Imagenes de un proyecto en orden
async function getImagesByProject(projectId, db = pool) {
    const result = await db.query(
        `SELECT ${IMAGE_COLUMNS} FROM project_images WHERE project_id = $1 ORDER BY position`,
        [projectId]
    );
    return result.rows.map(mapImage);
}

//Una imagen por su id o null si no existe
async function getImageById(imageId, db = pool) {
    const result = await db.query(`SELECT ${IMAGE_COLUMNS} FROM project_images WHERE id = $1`, [imageId]);
    return result.rows.length > 0 ? mapImage(result.rows[0]) : null;
}

//Cuenta las imagenes para respetar el limite
async function countImagesByProject(projectId, db = pool) {
    const result = await db.query(`SELECT COUNT(*)::int AS total FROM project_images WHERE project_id = $1`, [projectId]);
    return result.rows[0].total;
}

//Agrega una imagen y devuelve su id
async function addProjectImage(projectId, storagePath, position, db = pool) {
    const result = await db.query(
        `INSERT INTO project_images (project_id, storage_path, position) VALUES ($1, $2, $3) RETURNING id`,
        [projectId, storagePath, position]
    );
    return result.rows[0].id;
}

//Cambia la posicion de una imagen para reordenarlas
async function updateImagePosition(imageId, position, db = pool) {
    await db.query(`UPDATE project_images SET position = $2 WHERE id = $1`, [imageId, position]);
}

//Elimina una imagen del proyecto
async function deleteImage(imageId, db = pool) {
    await db.query(`DELETE FROM project_images WHERE id = $1`, [imageId]);
}

module.exports = {
    getImagesByProject, getImageById, countImagesByProject,
    addProjectImage, updateImagePosition, deleteImage
};