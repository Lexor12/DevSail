// Rutas para que cualquier usuario verificado reporte proyectos o comentarios
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken, allowRoles } = require('../middlewares/auth.middleware');

// POST /api/reports, envia un reporte sobre un proyecto o un comentario
router.post('/', verifyToken, allowRoles('developer'), reportController.createReport);

module.exports = router;    