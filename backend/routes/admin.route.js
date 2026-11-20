// Rutas exclusivas del panel de administracion y moderacion
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, allowRoles } = require('../middlewares/auth.middleware');

// Todas las rutas de este archivo piden sesion iniciada y rol de administrador
router.use(verifyToken, allowRoles('admin'));

// GET /api/admin/dashboard, las 6 tarjetas de resumen del panel
router.get('/dashboard', adminController.getDashboard);

// GET /api/admin/reports, lista paginada y filtrada de reportes agrupados
router.get('/reports', adminController.getReports);

// GET /api/admin/reports/:id, detalle de un reporte con todas sus entradas individuales
router.get('/reports/:id', adminController.getReportDetail);

// PATCH /api/admin/reports/:id/resolve, resuelve un reporte (ocultar contenido o descartar)
router.patch('/reports/:id/resolve', adminController.resolveReport);

// GET /api/admin/projects, lista filtrada de proyectos para moderacion directa
router.get('/projects', adminController.getAdminProjects);

// PATCH /api/admin/projects/:id/visibility, oculta o vuelve a mostrar un proyecto
router.patch('/projects/:id/visibility', adminController.toggleProjectVisibility);

// GET /api/admin/comments, lista filtrada de comentarios para moderacion directa
router.get('/comments', adminController.getAdminComments);

// PATCH /api/admin/comments/:id/visibility, oculta o vuelve a mostrar un comentario
router.patch('/comments/:id/visibility', adminController.toggleCommentVisibility);

// GET /api/admin/featured, lista de destacados activos y los que vencen en menos de 24 horas
router.get('/featured', adminController.getActiveFeatured);

// PATCH /api/admin/featured/:projectId/remove, retira manualmente un proyecto destacado
router.patch('/featured/:projectId/remove', adminController.removeFeaturedProject);

// GET /api/admin/income, reporte de pagos e ingresos con filtros y resumen
router.get('/income', adminController.getIncomeReport);

module.exports = router;