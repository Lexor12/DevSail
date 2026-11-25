//Acá estan las rutas de registro, verificacion de correo y contraseñas
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

//Crea la cuenta y manda el codigo al correo
router.post('/register', authController.register);

//Valida el codigo e inicia la sesion
router.post('/verify-email', authController.verifyEmail);

//Reenvia un codigo nuevo
router.post('/resend-code', authController.resendVerificationCode);

//Inicia sesion y guarda el JWT en una cookie httpOnly
router.post('/login', authController.login);

//Borra la cookie de sesion
router.post('/logout', authController.logout);

//Datos del usuario conectado
router.get('/session', verifyToken, authController.getSession);

//Manda el codigo de recuperacion si el correo existe
router.post('/forgot-password', authController.forgotPassword);

//Cambia la contraseña con el codigo del correo
router.post('/reset-password', authController.resetPassword);

//Cambia la contraseña estando dentro de la cuenta
router.put('/change-password', verifyToken, authController.changePassword);

module.exports = router;