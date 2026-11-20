// Este archivo maneja las calificaciones con 5 criterios y comentario de los proyectos,
// ademas de la lista personal de proyectos guardados por cada desarrollador.
const pool = require('../config/db');
const projectRepo = require('../services/repositories/project.service');
const ratingRepo = require('../services/repositories/rating.service');
const savedRepo = require('../services/repositories/savedProject.service');
const { isValidScore, isValidLength, isValidUuid, isValidPositiveInteger } = require('../utils/validators');

// Lista paginada de calificaciones y comentarios de un proyecto
async function getProjectRatings(req, res) {
    try {
        const projectId = req.params.projectId;
        if (!isValidUuid(projectId)) {
            return res.status(400).json({ message: 'El ID del proyecto no es válido.' });
        }

        const sortBy = req.query.sortBy || 'recent';
        const page = isValidPositiveInteger(req.query.page) ? Number(req.query.page) : 1;
        const pageSize = isValidPositiveInteger(req.query.pageSize) ? Math.min(Number(req.query.pageSize), 50) : 10;

        const result = await ratingRepo.getRatingsByProject(projectId, sortBy, page, pageSize);

        return res.status(200).json({
            ratings: result.ratings,
            total: result.total,
            page,
            pageSize
        });
    } catch (error) {
        console.error('Error en getProjectRatings:', error);
        return res.status(500).json({ message: 'Error al obtener las calificaciones.' });
    }
}

// Crea o actualiza la calificacion de un usuario en un proyecto y recalcula los promedios
async function submitRating(req, res) {
    const client = await pool.connect();
    try {
        const projectId = req.params.projectId;
        const { scoreDesign, scoreUsefulness, scoreCodeQuality, scoreDocumentation, scoreInnovation, comment } = req.body;

        if (!isValidUuid(projectId)) {
            return res.status(400).json({ message: 'El ID del proyecto no es válido.' });
        }
        if (!isValidScore(scoreDesign) || !isValidScore(scoreUsefulness) ||
            !isValidScore(scoreCodeQuality) || !isValidScore(scoreDocumentation) ||
            !isValidScore(scoreInnovation)) {
            return res.status(400).json({ message: 'Las 5 calificaciones deben ser números enteros del 1 al 5.' });
        }

        const cleanComment = typeof comment === 'string' && comment.trim() !== '' ? comment.trim() : null;
        if (cleanComment && !isValidLength(cleanComment, 10, 500)) {
            return res.status(400).json({ message: 'El comentario debe tener entre 10 y 500 caracteres.' });
        }

        const project = await projectRepo.getProjectById(projectId);
        if (!project || project.status !== 'published') {
            return res.status(404).json({ message: 'Proyecto no disponible para calificar.' });
        }

        // Un desarrollador no puede calificar su propio proyecto
        if (project.ownerId === req.user.id) {
            return res.status(403).json({ message: 'No puedes calificar tu propio proyecto.' });
        }

        const existingRating = await ratingRepo.getRatingByUserAndProject(req.user.id, projectId);

        // Si el comentario anterior fue ocultado por moderacion, no dejamos que lo vuelva a escribir
        if (existingRating && existingRating.commentHidden && cleanComment !== null) {
            return res.status(403).json({
                message: 'Tu comentario anterior fue ocultado por moderación; puedes editar tus estrellas pero no agregar texto.'
            });
        }

        const payload = {
            projectId,
            userId: req.user.id,
            scoreDesign: Number(scoreDesign),
            scoreUsefulness: Number(scoreUsefulness),
            scoreCodeQuality: Number(scoreCodeQuality),
            scoreDocumentation: Number(scoreDocumentation),
            scoreInnovation: Number(scoreInnovation),
            comment: existingRating && existingRating.commentHidden ? existingRating.comment : cleanComment
        };

        await client.query('BEGIN');

        if (existingRating) {
            await ratingRepo.updateRating(existingRating.id, payload, client);
        } else {
            await ratingRepo.createRating(payload, client);
        }

        // Recalculamos de inmediato los 5 promedios y el promedio general del proyecto
        await projectRepo.recalculateProjectRatings(projectId, client);

        await client.query('COMMIT');

        return res.status(existingRating ? 200 : 201).json({
            message: existingRating ? 'Calificación actualizada.' : 'Calificación publicada.'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en submitRating:', error);
        return res.status(500).json({ message: 'Error al guardar la calificación.' });
    } finally {
        client.release();
    }
}

// Elimina la calificacion propia de un usuario y recalcula el promedio del proyecto
async function deleteMyRating(req, res) {
    const client = await pool.connect();
    try {
        const projectId = req.params.projectId;
        if (!isValidUuid(projectId)) {
            return res.status(400).json({ message: 'El ID del proyecto no es válido.' });
        }

        const existingRating = await ratingRepo.getRatingByUserAndProject(req.user.id, projectId);
        if (!existingRating) {
            return res.status(404).json({ message: 'No tienes una calificación en este proyecto.' });
        }

        await client.query('BEGIN');
        await ratingRepo.deleteRating(existingRating.id, client);
        await projectRepo.recalculateProjectRatings(projectId, client);
        await client.query('COMMIT');

        return res.status(200).json({ message: 'Calificación eliminada.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en deleteMyRating:', error);
        return res.status(500).json({ message: 'Error al eliminar la calificación.' });
    } finally {
        client.release();
    }
}

// Guarda o quita un proyecto de la lista personal de favoritos del usuario
async function toggleSaveProject(req, res) {
    const client = await pool.connect();
    try {
        const projectId = req.params.projectId;
        if (!isValidUuid(projectId)) {
            return res.status(400).json({ message: 'El ID del proyecto no es válido.' });
        }

        const project = await projectRepo.getProjectById(projectId);
        if (!project || project.status !== 'published') {
            return res.status(404).json({ message: 'Proyecto no disponible.' });
        }
        if (project.ownerId === req.user.id) {
            return res.status(400).json({ message: 'No necesitas guardar tu propio proyecto.' });
        }

        const alreadySaved = await savedRepo.isProjectSavedByUser(req.user.id, projectId);

        await client.query('BEGIN');
        if (alreadySaved) {
            await savedRepo.unsaveProject(req.user.id, projectId, client);
        } else {
            await savedRepo.saveProject(req.user.id, projectId, client);
        }
        await projectRepo.recalculateProjectSaves(projectId, client);
        await client.query('COMMIT');

        return res.status(200).json({
            saved: !alreadySaved,
            message: alreadySaved ? 'Proyecto quitado de guardados.' : 'Proyecto guardado.'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en toggleSaveProject:', error);
        return res.status(500).json({ message: 'Error al actualizar guardados.' });
    } finally {
        client.release();
    }
}

// Devuelve la lista de proyectos guardados por el usuario logueado
async function getMySavedProjects(req, res) {
    try {
        const sortBy = req.query.sortBy === 'rated' ? 'rated' : 'recent';
        const projects = await savedRepo.getSavedProjectsByUser(req.user.id, sortBy);
        return res.status(200).json({ projects });
    } catch (error) {
        console.error('Error en getMySavedProjects:', error);
        return res.status(500).json({ message: 'Error al cargar tus proyectos guardados.' });
    }
}

module.exports = {
    getProjectRatings,
    submitRating,
    deleteMyRating,
    toggleSaveProject,
    getMySavedProjects
};