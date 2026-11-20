//acá estan las rutas de autenticacion, registro, verificacion de correo y manejo de contraseñas
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

//POST /api/auth/register, crea una cuenta nueva y manda el codigo de 6 digitos al correo
router.post('/register', authController.register);

//POST /api/auth/verify-email, valida el codigo de 6 digitos e inicia la sesion con cookie
router.post('/verify-email', authController.verifyEmail);

//POST /api/auth/resend-code, reenvia un nuevo codigo de verificacion al correo
router.post('/resend-code', authController.resendVerificationCode);

//POST /api/auth/login, inicia sesion y guarda el JWT en una cookie httpOnly
router.post('/login', authController.login);

//POST /api/auth/logout, borra la cookie de sesion del navegador
router.post('/logout', authController.logout);

//GET /api/auth/session, devuelve los datos del usuario logueado actualmente
router.get('/session', verifyToken, authController.getSession);

//POST /api/auth/forgot-password, manda codigo de recuperacion si el correo existe
router.post('/forgot-password', authController.forgotPassword);

//POST /api/auth/reset-password, cambia la contraseña usando el codigo recibido por correo
router.post('/reset-password', authController.resetPassword);

//PUT /api/auth/change-password, cambia la contraseña estando dentro de la cuenta
router.put('/change-password', verifyToken, authController.changePassword);

module.exports = router;