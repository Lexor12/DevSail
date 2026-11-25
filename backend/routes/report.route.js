// Rutas para que los usuarios verificados reporten contenido
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken, allowRoles } = require('../middlewares/auth.middleware');

// Envia un reporte de un proyecto o comentario
router.post('/', verifyToken, allowRoles('developer'), reportController.createReport);

module.exports = router;    