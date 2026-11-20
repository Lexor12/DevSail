// Este archivo recibe los reportes enviados por los usuarios sobre proyectos o comentarios
// y los agrupa en la tabla de moderacion sin duplicar registros.
const pool = require('../config/db');
const projectRepo = require('../services/repositories/project.service');
const ratingRepo = require('../services/repositories/rating.service');
const catalogRepo = require('../services/repositories/catalog.service');
const reportRepo = require('../services/repositories/report.service');
const { isValidUuid, isValidLength } = require('../utils/validators');

// Crea un reporte sobre un proyecto o un comentario
async function createReport(req, res) {
    const client = await pool.connect();
    try {
        const { targetType, targetId, reasonId, detail } = req.body;

        if (targetType !== 'project' && targetType !== 'comment') {
            return res.status(400).json({ message: 'Tipo de contenido a reportar inválido.' });
        }
        if (!isValidUuid(targetId) || !isValidUuid(reasonId)) {
            return res.status(400).json({ message: 'Los identificadores enviados no son válidos.' });
        }

        // Revisamos que el motivo exista y si exige que el usuario escriba detalle (por ejemplo en "Otro")
        const reason = await catalogRepo.getReportReasonById(reasonId);
        if (!reason) {
            return res.status(400).json({ message: 'El motivo de reporte seleccionado no existe.' });
        }

        const cleanDetail = typeof detail === 'string' && detail.trim() !== '' ? detail.trim() : null;
        if (reason.requiresDetail && !cleanDetail) {
            return res.status(400).json({ message: 'Debes escribir una descripción para este motivo de reporte.' });
        }
        if (cleanDetail && !isValidLength(cleanDetail, 1, 300)) {
            return res.status(400).json({ message: 'La descripción no puede superar los 300 caracteres.' });
        }

        // Verificamos que el proyecto o comentario exista y que el usuario no se este reportando a si mismo
        if (targetType === 'project') {
            const project = await projectRepo.getProjectById(targetId);
            if (!project || project.status !== 'published') {
                return res.status(404).json({ message: 'El proyecto no está disponible.' });
            }
            if (project.ownerId === req.user.id) {
                return res.status(400).json({ message: 'No puedes reportar tu propio proyecto.' });
            }
        } else {
            const rating = await ratingRepo.getRatingById(targetId);
            if (!rating || !rating.comment || rating.commentHidden) {
                return res.status(404).json({ message: 'El comentario no está disponible.' });
            }
            if (rating.userId === req.user.id) {
                return res.status(400).json({ message: 'No puedes reportar tu propio comentario.' });
            }
        }

        // Evitamos que la misma persona mande dos reportes sobre exactamente lo mismo
        const alreadyReported = await reportRepo.hasUserReportedTarget(req.user.id, targetType, targetId);
        if (alreadyReported) {
            return res.status(409).json({ message: 'Ya enviaste un reporte sobre este contenido anteriormente.' });
        }

        await client.query('BEGIN');
        await reportRepo.addReportWithEntry({
            targetType,
            targetId,
            reporterId: req.user.id,
            reasonId,
            detail: cleanDetail
        }, client);
        await client.query('COMMIT');

        return res.status(201).json({ message: 'Reporte enviado. Nuestro equipo lo revisará.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en createReport:', error);
        return res.status(500).json({ message: 'Error al enviar el reporte.' });
    } finally {
        client.release();
    }
}

module.exports = { createReport };