// Rutas de calificaciones con 5 criterios, comentarios y proyectos guardados
const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/rating.controller');
const { verifyToken, allowRoles } = require('../middlewares/auth.middleware');

// GET /api/ratings/saved, lista personal de proyectos guardados del desarrollador
router.get('/saved', verifyToken, allowRoles('developer'), ratingController.getMySavedProjects);

// POST /api/ratings/saved/:projectId, guarda o quita un proyecto de favoritos
router.post('/saved/:projectId', verifyToken, allowRoles('developer'), ratingController.toggleSaveProject);

// GET /api/ratings/project/:projectId, lista paginada de calificaciones y comentarios de un proyecto
router.get('/project/:projectId', ratingController.getProjectRatings);

// POST /api/ratings/project/:projectId, crea o edita la calificacion propia en un proyecto
router.post('/project/:projectId', verifyToken, allowRoles('developer'), ratingController.submitRating);

// DELETE /api/ratings/project/:projectId, elimina la calificacion propia en un proyecto
router.delete('/project/:projectId', verifyToken, allowRoles('developer'), ratingController.deleteMyRating);

module.exports = router;