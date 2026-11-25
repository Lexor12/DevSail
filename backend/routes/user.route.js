// Rutas de perfil publico y configuracion de la cuenta
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, allowRoles } = require('../middlewares/auth.middleware');

// Datos de mi cuenta
router.get('/me', verifyToken, userController.getMyAccount);

// Actualiza nombre, usuario, biografia y enlaces
router.put('/me', verifyToken, userController.updateProfile);

// Sube o cambia la foto de perfil
router.post('/me/avatar', verifyToken, userController.updateAvatar);

// Borra la foto de perfil
router.delete('/me/avatar', verifyToken, userController.removeAvatar);

// Elimina la cuenta
router.delete('/me', verifyToken, allowRoles('developer'), userController.deleteAccount);

// Perfil publico, va al final para que no choque con me
router.get('/profile/:username', userController.getPublicProfile);

module.exports = router;