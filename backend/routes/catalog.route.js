// Rutas publicas para cargar los catalogos cerrados en los formularios del frontend
const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalog.controller');

// GET /api/catalogs/projects, devuelve los tipos de proyecto y todas las tecnologias
router.get('/projects', catalogController.getProjectCatalogs);

// GET /api/catalogs/report-reasons, devuelde los motivos disponibles para reportar contenido
router.get('/report-reasons', catalogController.getReportReasons);

module.exports = router;