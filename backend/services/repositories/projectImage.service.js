//Este archivo permite la creación y gestión de  las imagenes de los proyectos, los cuales se almacenan en Supabase Storage y guardamos con una ruta + posición para saber cual mostrar primero
//Para poder hacer las consultas a la base de datos, importamos el pooler de conexiones
const pool = require('../../config/db');
const { ProjectImage } = require('../../models/projectImage.model');

const IMAGE_COLUMNS = `id, project_id AS "projectId", storage_path AS "storagePath", position, created_at AS "createdAt"`;

function mapImage(r) {
    return new ProjectImage(r.id, r.projectId, r.storagePath, r.position, r.createdAt);
}

//Esta función permite obtener todas las imagenes de un proyecto, ordenadas por su posición
async function getImagesByProject(projectId, db = pool) {
    const result = await db.query(
        `SELECT ${IMAGE_COLUMNS} FROM project_images WHERE project_id = $1 ORDER BY position`,
        [projectId]
    );
    return result.rows.map(mapImage);
}

//Esta función permite obtener una imagen por su id, si no existe retorna null
async function getImageById(imageId, db = pool) {
    const result = await db.query(`SELECT ${IMAGE_COLUMNS} FROM project_images WHERE id = $1`, [imageId]);
    return result.rows.length > 0 ? mapImage(result.rows[0]) : null;
}

//Esta función permite contar cuantas imagenes tiene un proyecto, para poder limitar la cantidad de imagenes que puede tener un proyecto
async function countImagesByProject(projectId, db = pool) {
    const result = await db.query(`SELECT COUNT(*)::int AS total FROM project_images WHERE project_id = $1`, [projectId]);
    return result.rows[0].total;
}

//Esta función permite agregar una nueva imagen a un proyecto, con una ruta de almacenamiento y una posición, retorna el id de la nueva imagen
async function addProjectImage(projectId, storagePath, position, db = pool) {
    const result = await db.query(
        `INSERT INTO project_images (project_id, storage_path, position) VALUES ($1, $2, $3) RETURNING id`,
        [projectId, storagePath, position]
    );
    return result.rows[0].id;
}

//
//Esta función permite actualizar la posición de una imagen, para poder reordenar las imagenes de un proyecto
async function updateImagePosition(imageId, position, db = pool) {
    await db.query(`UPDATE project_images SET position = $2 WHERE id = $1`, [imageId, position]);
}

//Esta función permite eliminar una imagen de un proyecto, para poder eliminar imagenes que ya no se quieren mostrar
async function deleteImage(imageId, db = pool) {
    await db.query(`DELETE FROM project_images WHERE id = $1`, [imageId]);
}

module.exports = {
    getImagesByProject, getImageById, countImagesByProject,
    addProjectImage, updateImagePosition, deleteImage
};