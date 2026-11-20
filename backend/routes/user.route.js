// Rutas de perfil publico y configuracion de cuenta del desarrollador
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, allowRoles } = require('../middlewares/auth.middleware');

// GET /api/users/me, devuelve los datos completos de mi propia cuenta para editar perfil
router.get('/me', verifyToken, userController.getMyAccount);

// PUT /api/users/me, actualiza nombre, usuario, biografia y enlaces sociales
router.put('/me', verifyToken, userController.updateProfile);

// POST /api/users/me/avatar, sube o reemplaza la foto de perfil
router.post('/me/avatar', verifyToken, userController.updateAvatar);

// DELETE /api/users/me/avatar, elimina la foto de perfil actual
router.delete('/me/avatar', verifyToken, userController.removeAvatar);

// DELETE /api/users/me, elimina definitivamente la cuenta del desarrollador
router.delete('/me', verifyToken, allowRoles('developer'), userController.deleteAccount);

// GET /api/users/profile/:username, perfil publico de un desarrollador (va al final para no chocar con /me)
router.get('/profile/:username', userController.getPublicProfile);

module.exports = router;