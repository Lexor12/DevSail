// Rutas para explorar, publicar, editar y administrar proyectos
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { verifyToken, optionalAuth, allowRoles } = require('../middlewares/auth.middleware');

// GET /api/projects/home, secciones de inicio (destacados, mejor calificados y recientes)
router.get('/home', projectController.getHomeProjects);

// GET /api/projects/search, busqueda con filtros combinados y paginacion
router.get('/search', projectController.searchProjects);

// GET /api/projects/my-projects, lista de todos los proyectos del desarrollador logueado
router.get('/my-projects', verifyToken, allowRoles('developer'), projectController.getMyProjects);

// POST /api/projects, publica un nuevo proyecto con sus imagenes y tecnologias
router.post('/', verifyToken, allowRoles('developer'), projectController.createProject);

// GET /api/projects/:id, ficha completa de un proyecto (usa optionalAuth para saber si es dueño o visitante)
router.get('/:id', optionalAuth, projectController.getProjectDetail);

// PUT /api/projects/:id, edita los datos de un proyecto existente
router.put('/:id', verifyToken, allowRoles('developer'), projectController.updateProject);

// PATCH /api/projects/:id/status, activa o desactiva un proyecto del dueño
router.patch('/:id/status', verifyToken, allowRoles('developer'), projectController.toggleProjectStatus);

// POST /api/projects/:id/images, agrega una captura adicional al proyecto (maximo 5)
router.post('/:id/images', verifyToken, allowRoles('developer'), projectController.addProjectImage);

// PUT /api/projects/:id/images/reorder, cambia el orden de las imagenes (la 1 es portada)
router.put('/:id/images/reorder', verifyToken, allowRoles('developer'), projectController.reorderProjectImages);

// DELETE /api/projects/:id/images/:imageId, elimina una imagen especifica del proyecto
router.delete('/:id/images/:imageId', verifyToken, allowRoles('developer'), projectController.deleteProjectImage);

// DELETE /api/projects/:id, elimina definitivamente un proyecto
router.delete('/:id', verifyToken, allowRoles('developer'), projectController.deleteProject);

module.exports = router;