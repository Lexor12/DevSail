// Rutas para explorar, publicar y administrar proyectos
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { verifyToken, optionalAuth, allowRoles } = require('../middlewares/auth.middleware');

// Secciones del inicio
router.get('/home', projectController.getHomeProjects);

// Busqueda con filtros y paginas
router.get('/search', projectController.searchProjects);

// Proyectos del usuario conectado
router.get('/my-projects', verifyToken, allowRoles('developer'), projectController.getMyProjects);

// Publica un proyecto nuevo
router.post('/', verifyToken, allowRoles('developer'), projectController.createProject);

// Insignia publica para el README
router.get('/:id/badge', projectController.getProjectBadge);

// Detalle de un proyecto, optionalAuth permite saber si es el dueño o un visitante
router.get('/:id', optionalAuth, projectController.getProjectDetail);

// Edita un proyecto
router.put('/:id', verifyToken, allowRoles('developer'), projectController.updateProject);

// Activa o desactiva un proyecto
router.patch('/:id/status', verifyToken, allowRoles('developer'), projectController.toggleProjectStatus);

// Agrega una captura, el maximo son 4
router.post('/:id/images', verifyToken, allowRoles('developer'), projectController.addProjectImage);

// Cambia el orden de las imagenes, la primera es la portada
router.put('/:id/images/reorder', verifyToken, allowRoles('developer'), projectController.reorderProjectImages);

// Elimina una imagen
router.delete('/:id/images/:imageId', verifyToken, allowRoles('developer'), projectController.deleteProjectImage);

// Elimina un proyecto
router.delete('/:id', verifyToken, allowRoles('developer'), projectController.deleteProject);

module.exports = router;