// Acciones del panel de administracion como el resumen, los reportes,
// ocultar proyectos y comentarios, los destacados y los ingresos
const pool = require('../config/db');
const adminRepo = require('../services/repositories/admin.service');
const reportRepo = require('../services/repositories/report.service');
const projectRepo = require('../services/repositories/project.service');
const ratingRepo = require('../services/repositories/rating.service');
const featuredRepo = require('../services/repositories/featured.service');
const paymentRepo = require('../services/repositories/payment.service');
const userRepo = require('../services/repositories/user.service');
const logRepo = require('../services/repositories/moderationLog.service');
const mailService = require('../services/mail/mail.service');
const { isValidUuid, isValidLength, isValidPositiveInteger, isValidDate } = require('../utils/validators');

// Las 6 tarjetas del resumen del administrador
async function getDashboard(req, res) {
    try {
        const summary = await adminRepo.getDashboardSummary();
        return res.status(200).json({ summary });
    } catch (error) {
        console.error('Error en getDashboard:', error);
        return res.status(500).json({ message: 'Error al cargar el resumen del panel.' });
    }
}

// Lista de reportes agrupados con filtros y paginas
async function getReports(req, res) {
    try {
        const page = isValidPositiveInteger(req.query.page) ? Number(req.query.page) : 1;
        const pageSize = isValidPositiveInteger(req.query.pageSize) ? Math.min(Number(req.query.pageSize), 50) : 10;

        const filters = {
            status: req.query.status || '',
            targetType: req.query.targetType || '',
            reasonId: req.query.reasonId && isValidUuid(req.query.reasonId) ? req.query.reasonId : '',
            dateFrom: req.query.dateFrom && isValidDate(req.query.dateFrom) ? req.query.dateFrom : '',
            dateTo: req.query.dateTo && isValidDate(req.query.dateTo) ? req.query.dateTo : '',
            page,
            pageSize
        };

        const result = await reportRepo.getReportList(filters);
        return res.status(200).json({
            reports: result.reports,
            total: result.total,
            page,
            pageSize
        });
    } catch (error) {
        console.error('Error en getReports:', error);
        return res.status(500).json({ message: 'Error al cargar los reportes.' });
    }
}

// Detalle de un reporte con todas las personas que lo enviaron
async function getReportDetail(req, res) {
    try {
        const reportId = req.params.id;
        if (!isValidUuid(reportId)) {
            return res.status(400).json({ message: 'El ID del reporte no es válido.' });
        }

        const report = await reportRepo.getReportById(reportId);
        if (!report) {
            return res.status(404).json({ message: 'Reporte no encontrado.' });
        }

        const entries = await reportRepo.getEntriesByReportId(reportId);

        // Cargamos el contenido reportado para que el admin lo revise antes de decidir
        let targetContent = null;
        if (report.targetType === 'project' && report.projectId) {
            targetContent = await projectRepo.getProjectDetailById(report.projectId);
        } else if (report.targetType === 'comment' && report.ratingId) {
            targetContent = await ratingRepo.getRatingById(report.ratingId);
        }

        return res.status(200).json({
            report,
            entries,
            targetContent
        });
    } catch (error) {
        console.error('Error en getReportDetail:', error);
        return res.status(500).json({ message: 'Error al obtener el detalle del reporte.' });
    }
}

// Resuelve un reporte pendiente, ya sea ocultando el contenido o descartandolo
async function resolveReport(req, res) {
    const client = await pool.connect();
    try {
        const reportId = req.params.id;
        const { decision, reason } = req.body; // hide o dismiss

        if (!isValidUuid(reportId)) {
            return res.status(400).json({ message: 'El ID del reporte no es válido.' });
        }
        if (decision !== 'hide' && decision !== 'dismiss') {
            return res.status(400).json({ message: 'La decisión debe ser hide o dismiss.' });
        }
        if (!isValidLength(reason, 5, 300)) {
            return res.status(400).json({ message: 'Debes escribir una justificación de 5 a 300 caracteres.' });
        }

        const report = await reportRepo.getReportById(reportId);
        if (!report) {
            return res.status(404).json({ message: 'Reporte no encontrado.' });
        }
        if (report.status !== 'pending') {
            return res.status(400).json({ message: 'Este reporte ya fue resuelto anteriormente.' });
        }

        const cleanReason = reason.trim();
        let ownerToNotify = null;
        let targetName = '';

        await client.query('BEGIN');

        if (decision === 'hide') {
            if (report.targetType === 'project' && report.projectId) {
                const project = await projectRepo.getProjectById(report.projectId);
                if (project) {
                    await projectRepo.setProjectStatus(project.id, 'hidden', {
                        hiddenReason: cleanReason,
                        hiddenBy: req.user.id
                    }, client);
                    // Si el proyecto estaba destacado tambien se le quita
                    await featuredRepo.withdrawFeatured(project.id, cleanReason, req.user.id, client);
                    ownerToNotify = await userRepo.getUserById(project.ownerId);
                    targetName = project.title;
                }
            } else if (report.targetType === 'comment' && report.ratingId) {
                const rating = await ratingRepo.getRatingById(report.ratingId);
                if (rating) {
                    await ratingRepo.hideRatingComment(rating.id, cleanReason, req.user.id, client);
                    ownerToNotify = await userRepo.getUserById(rating.userId);
                    targetName = 'Comentario en proyecto';
                }
            }

            await reportRepo.resolveReport(reportId, 'resolved_hidden', cleanReason, req.user.id, client);
            await logRepo.createModerationLog({
                adminId: req.user.id,
                action: report.targetType === 'project' ? 'hide_project' : 'hide_comment',
                targetType: report.targetType,
                targetId: report.projectId || report.ratingId,
                reason: cleanReason
            }, client);
        } else {
            await reportRepo.resolveReport(reportId, 'dismissed', cleanReason, req.user.id, client);
            await logRepo.createModerationLog({
                adminId: req.user.id,
                action: 'dismiss_report',
                targetType: 'report',
                targetId: reportId,
                reason: cleanReason
            }, client);
        }

        await client.query('COMMIT');

        // Si se oculto contenido, avisamos por correo al autor
        if (decision === 'hide' && ownerToNotify) {
            try {
                const label = report.targetType === 'project' ? 'Proyecto ocultado' : 'Comentario ocultado';
                await mailService.sendModerationNoticeEmail(ownerToNotify.email, ownerToNotify.fullName, label, targetName, cleanReason);
            } catch (mailError) {
                console.error('No se pudo mandar correo de moderacion:', mailError);
            }
        }

        return res.status(200).json({ message: 'Reporte resuelto correctamente.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en resolveReport:', error);
        return res.status(500).json({ message: 'Error al resolver el reporte.' });
    } finally {
        client.release();
    }
}

// Lista de proyectos para gestion directa del administrador
async function getAdminProjects(req, res) {
    try {
        const page = isValidPositiveInteger(req.query.page) ? Number(req.query.page) : 1;
        const pageSize = isValidPositiveInteger(req.query.pageSize) ? Math.min(Number(req.query.pageSize), 50) : 10;

        const result = await adminRepo.getAdminProjects({
            status: req.query.status || '',
            text: typeof req.query.text === 'string' ? req.query.text.trim() : '',
            page,
            pageSize
        });

        return res.status(200).json({
            projects: result.projects,
            total: result.total,
            page,
            pageSize
        });
    } catch (error) {
        console.error('Error en getAdminProjects:', error);
        return res.status(500).json({ message: 'Error al cargar los proyectos.' });
    }
}

// Oculta o vuelve a mostrar un proyecto directamente desde el panel
async function toggleProjectVisibility(req, res) {
    const client = await pool.connect();
    try {
        const projectId = req.params.id;
        const { action, reason } = req.body; // hide o show

        if (!isValidUuid(projectId)) {
            return res.status(400).json({ message: 'El ID del proyecto no es válido.' });
        }
        if (action !== 'hide' && action !== 'show') {
            return res.status(400).json({ message: 'La acción debe ser hide o show.' });
        }
        if (action === 'hide' && !isValidLength(reason, 5, 300)) {
            return res.status(400).json({ message: 'Debes escribir un motivo de 5 a 300 caracteres para ocultar el proyecto.' });
        }

        const project = await projectRepo.getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado.' });
        }

        const cleanReason = typeof reason === 'string' && reason.trim() !== '' ? reason.trim() : null;

        await client.query('BEGIN');

        if (action === 'hide') {
            await projectRepo.setProjectStatus(projectId, 'hidden', {
                hiddenReason: cleanReason,
                hiddenBy: req.user.id
            }, client);
            await featuredRepo.withdrawFeatured(projectId, cleanReason, req.user.id, client);
            await logRepo.createModerationLog({
                adminId: req.user.id,
                action: 'hide_project',
                targetType: 'project',
                targetId: projectId,
                reason: cleanReason
            }, client);
        } else {
            await projectRepo.setProjectStatus(projectId, 'published', {}, client);
            await logRepo.createModerationLog({
                adminId: req.user.id,
                action: 'show_project',
                targetType: 'project',
                targetId: projectId,
                reason: cleanReason
            }, client);
        }

        await client.query('COMMIT');

        if (action === 'hide') {
            try {
                const owner = await userRepo.getUserById(project.ownerId);
                if (owner) {
                    await mailService.sendModerationNoticeEmail(
                        owner.email, owner.fullName, 'Proyecto ocultado', project.title, cleanReason
                    );
                }
            } catch (mailError) {
                console.error('No se pudo mandar aviso por correo:', mailError);
            }
        }

        return res.status(200).json({
            message: action === 'hide' ? 'Proyecto ocultado.' : 'Proyecto visible nuevamente.'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en toggleProjectVisibility:', error);
        return res.status(500).json({ message: 'Error al cambiar la visibilidad del proyecto.' });
    } finally {
        client.release();
    }
}

// Lista de comentarios para gestion directa del administrador
async function getAdminComments(req, res) {
    try {
        const page = isValidPositiveInteger(req.query.page) ? Number(req.query.page) : 1;
        const pageSize = isValidPositiveInteger(req.query.pageSize) ? Math.min(Number(req.query.pageSize), 50) : 10;

        let hiddenFilter = undefined;
        if (req.query.hidden === 'true') hiddenFilter = true;
        if (req.query.hidden === 'false') hiddenFilter = false;

        const result = await adminRepo.getAdminComments({
            hidden: hiddenFilter,
            page,
            pageSize
        });

        return res.status(200).json({
            comments: result.comments,
            total: result.total,
            page,
            pageSize
        });
    } catch (error) {
        console.error('Error en getAdminComments:', error);
        return res.status(500).json({ message: 'Error al cargar los comentarios.' });
    }
}

// Oculta o muestra el texto de un comentario, la calificacion no cambia
async function toggleCommentVisibility(req, res) {
    const client = await pool.connect();
    try {
        const ratingId = req.params.id;
        const { action, reason } = req.body; // hide o show

        if (!isValidUuid(ratingId)) {
            return res.status(400).json({ message: 'El ID del comentario no es válido.' });
        }
        if (action !== 'hide' && action !== 'show') {
            return res.status(400).json({ message: 'La acción debe ser hide o show.' });
        }
        if (action === 'hide' && !isValidLength(reason, 5, 300)) {
            return res.status(400).json({ message: 'Debes escribir un motivo de 5 a 300 caracteres para ocultar el comentario.' });
        }

        const rating = await ratingRepo.getRatingById(ratingId);
        if (!rating || !rating.comment) {
            return res.status(404).json({ message: 'Comentario no encontrado.' });
        }

        const cleanReason = typeof reason === 'string' && reason.trim() !== '' ? reason.trim() : null;

        await client.query('BEGIN');

        if (action === 'hide') {
            await ratingRepo.hideRatingComment(ratingId, cleanReason, req.user.id, client);
            await logRepo.createModerationLog({
                adminId: req.user.id,
                action: 'hide_comment',
                targetType: 'comment',
                targetId: ratingId,
                reason: cleanReason
            }, client);
        } else {
            await ratingRepo.showRatingComment(ratingId, client);
            await logRepo.createModerationLog({
                adminId: req.user.id,
                action: 'show_comment',
                targetType: 'comment',
                targetId: ratingId,
                reason: cleanReason
            }, client);
        }

        await client.query('COMMIT');

        if (action === 'hide') {
            try {
                const author = await userRepo.getUserById(rating.userId);
                if (author) {
                    await mailService.sendModerationNoticeEmail(
                        author.email, author.fullName, 'Comentario ocultado', 'Comentario en proyecto', cleanReason
                    );
                }
            } catch (mailError) {
                console.error('No se pudo mandar correo al autor del comentario:', mailError);
            }
        }

        return res.status(200).json({
            message: action === 'hide' ? 'Comentario ocultado.' : 'Comentario visible nuevamente.'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en toggleCommentVisibility:', error);
        return res.status(500).json({ message: 'Error al moderar el comentario.' });
    } finally {
        client.release();
    }
}

// Destacados vigentes y los que vencen en las proximas 24 horas
async function getActiveFeatured(req, res) {
    try {
        const [activeList, endingSoon] = await Promise.all([
            featuredRepo.getActiveFeaturedList(),
            featuredRepo.getFeaturedEndingSoon(24)
        ]);

        return res.status(200).json({
            activeList,
            endingSoon
        });
    } catch (error) {
        console.error('Error en getActiveFeatured:', error);
        return res.status(500).json({ message: 'Error al cargar los proyectos destacados.' });
    }
}

// Quita el destacado de un proyecto que no cumple las reglas
async function removeFeaturedProject(req, res) {
    const client = await pool.connect();
    try {
        const projectId = req.params.projectId;
        const { reason } = req.body;

        if (!isValidUuid(projectId)) {
            return res.status(400).json({ message: 'El ID del proyecto no es válido.' });
        }
        if (!isValidLength(reason, 5, 300)) {
            return res.status(400).json({ message: 'Debes escribir el motivo de retiro (5 a 300 caracteres).' });
        }

        const project = await projectRepo.getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado.' });
        }

        const cleanReason = reason.trim();

        await client.query('BEGIN');
        const removedIds = await featuredRepo.withdrawFeatured(projectId, cleanReason, req.user.id, client);
        if (removedIds.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Ese proyecto no tiene un destacado activo.' });
        }

        await logRepo.createModerationLog({
            adminId: req.user.id,
            action: 'remove_featured',
            targetType: 'featured',
            targetId: projectId,
            reason: cleanReason
        }, client);

        await client.query('COMMIT');

        try {
            const owner = await userRepo.getUserById(project.ownerId);
            if (owner) {
                await mailService.sendModerationNoticeEmail(
                    owner.email, owner.fullName, 'Retiro de proyecto destacado', project.title, cleanReason
                );
            }
        } catch (mailError) {
            console.error('No se pudo mandar aviso de retiro de destacado:', mailError);
        }

        return res.status(200).json({ message: 'Destacado retirado correctamente.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en removeFeaturedProject:', error);
        return res.status(500).json({ message: 'Error al retirar el destacado.' });
    } finally {
        client.release();
    }
}

// Ingresos y movimientos de PayPal con filtros y totales
async function getIncomeReport(req, res) {
    try {
        const page = isValidPositiveInteger(req.query.page) ? Number(req.query.page) : 1;
        const pageSize = isValidPositiveInteger(req.query.pageSize) ? Math.min(Number(req.query.pageSize), 50) : 10;

        const filters = {
            dateFrom: req.query.dateFrom && isValidDate(req.query.dateFrom) ? req.query.dateFrom : '',
            dateTo: req.query.dateTo && isValidDate(req.query.dateTo) ? req.query.dateTo : '',
            concept: req.query.concept || '',
            status: req.query.status || '',
            username: typeof req.query.username === 'string' ? req.query.username.trim() : '',
            page,
            pageSize
        };

        const [listResult, summary] = await Promise.all([
            paymentRepo.getPayments(filters),
            paymentRepo.getPaymentsSummary(filters)
        ]);

        return res.status(200).json({
            payments: listResult.payments,
            total: listResult.total,
            summary,
            page,
            pageSize
        });
    } catch (error) {
        console.error('Error en getIncomeReport:', error);
        return res.status(500).json({ message: 'Error al cargar los ingresos.' });
    }
}

module.exports = {
    getDashboard,
    getReports,
    getReportDetail,
    resolveReport,
    getAdminProjects,
    toggleProjectVisibility,
    getAdminComments,
    toggleCommentVisibility,
    getActiveFeatured,
    removeFeaturedProject,
    getIncomeReport
};