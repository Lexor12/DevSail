// Rutas del panel de administracion y moderacion
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, allowRoles } = require('../middlewares/auth.middleware');

// Todas piden sesion y rol de administrador
router.use(verifyToken, allowRoles('admin'));

// Las 6 tarjetas del resumen
router.get('/dashboard', adminController.getDashboard);

// Reportes agrupados con filtros y paginas
router.get('/reports', adminController.getReports);

// Detalle de un reporte con cada envio
router.get('/reports/:id', adminController.getReportDetail);

// Resuelve un reporte ocultando el contenido o descartandolo
router.patch('/reports/:id/resolve', adminController.resolveReport);

// Proyectos para moderar directamente
router.get('/projects', adminController.getAdminProjects);

// Oculta o muestra un proyecto
router.patch('/projects/:id/visibility', adminController.toggleProjectVisibility);

// Comentarios para moderar directamente
router.get('/comments', adminController.getAdminComments);

// Oculta o muestra un comentario
router.patch('/comments/:id/visibility', adminController.toggleCommentVisibility);

// Destacados activos y los que vencen en menos de 24 horas
router.get('/featured', adminController.getActiveFeatured);

// Quita un destacado manualmente
router.patch('/featured/:projectId/remove', adminController.removeFeaturedProject);

// Pagos e ingresos con filtros y resumen
router.get('/income', adminController.getIncomeReport);

module.exports = router;