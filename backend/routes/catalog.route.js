// Rutas publicas de los catalogos para los formularios
const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalog.controller');

// Tipos de proyecto y tecnologias
router.get('/projects', catalogController.getProjectCatalogs);

// Motivos para reportar contenido
router.get('/report-reasons', catalogController.getReportReasons);

module.exports = router;