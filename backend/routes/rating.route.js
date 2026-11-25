// Rutas de calificaciones, comentarios y guardados
const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/rating.controller');
const { verifyToken, allowRoles } = require('../middlewares/auth.middleware');

// Proyectos guardados del usuario
router.get('/saved', verifyToken, allowRoles('developer'), ratingController.getMySavedProjects);

// Guarda o quita un proyecto
router.post('/saved/:projectId', verifyToken, allowRoles('developer'), ratingController.toggleSaveProject);

// Calificaciones y comentarios de un proyecto
router.get('/project/:projectId', ratingController.getProjectRatings);

// Crea o edita mi calificacion
router.post('/project/:projectId', verifyToken, allowRoles('developer'), ratingController.submitRating);

// Elimina mi calificacion
router.delete('/project/:projectId', verifyToken, allowRoles('developer'), ratingController.deleteMyRating);

module.exports = router;