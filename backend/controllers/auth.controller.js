// Este archivo controla todo lo relacionado con cuentas y sesion: registro, verificacion de correo con codigo,
// inicio y cierre de sesion con cookies, recuperacion de contraseña y cambio de contraseña.
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { env } = require('../config/env');
const userRepo = require('../services/repositories/user.service');
const codeRepo = require('../services/repositories/verificationCode.service');
const legalRepo = require('../services/repositories/legalAcceptance.service');
const mailService = require('../services/mail/mail.service');
const {
    isValidFullName,
    isValidUsername,
    isValidEmail,
    isValidPassword,
    isValidVerificationCode
} = require('../utils/validators');

// Versiones actuales de los documentos legales que acepta el usuario al registrarse
const PRIVACY_VERSION = '1.0';
const TERMS_VERSION = '1.0';

// Esta funcion genera un numero aleatorio de 6 digitos como texto, por ejemplo "048291"
function generateSixDigitCode() {
    // randomInt saca un numero seguro entre 0 y 999999, y padStart le rellena ceros a la izquierda si salio corto
    const number = crypto.randomInt(0, 1000000);
    return String(number).padStart(6, '0');
}

// Esta funcion arma el token JWT y lo guarda dentro de una cookie httpOnly en la respuesta
function setSessionCookie(res, user) {
    const payload = {
        userId: user.id,
        role: user.role,
        tokenVersion: user.tokenVersion
    };

    const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
    res.cookie(env.cookieName, token, env.cookieOptions);
}

// Registro de una nueva cuenta de desarrollador (todavia sin verificar correo)
async function register(req, res) {
    const client = await pool.connect();
    try {
        const { fullName, username, email, password, confirmPassword, acceptPrivacy, acceptTerms } = req.body;

        // Validamos los formatos basicos antes de tocar la base de datos
        if (!isValidFullName(fullName)) {
            return res.status(400).json({ message: 'El nombre completo debe tener entre 2 y 80 letras.' });
        }
        if (!isValidUsername(username)) {
            return res.status(400).json({ message: 'El nombre de usuario debe tener de 3 a 20 caracteres en minúsculas, números o guion bajo.' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'El correo electrónico no tiene un formato válido.' });
        }
        if (!isValidPassword(password)) {
            return res.status(400).json({ message: 'La contraseña debe tener de 8 a 64 caracteres, al menos una mayúscula, una minúscula y un número.' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'La contraseña y su confirmación no coinciden.' });
        }
        if (acceptPrivacy !== true || acceptTerms !== true) {
            return res.status(400).json({ message: 'Debes aceptar el aviso de privacidad y los términos y condiciones.' });
        }

        const cleanFullName = fullName.trim();
        const cleanUsername = username.trim().toLowerCase();
        const cleanEmail = email.trim().toLowerCase();

        // Revisamos si ya existe una cuenta verificada con ese correo o con ese usuario
        const existingByEmail = await userRepo.getUserByEmail(cleanEmail);
        if (existingByEmail && existingByEmail.isVerified) {
            return res.status(409).json({ message: 'Este correo electrónico ya está registrado.' });
        }

        const existingByUsername = await userRepo.getUserByUsername(cleanUsername);
        if (existingByUsername && existingByUsername.isVerified) {
            return res.status(409).json({ message: 'Ese nombre de usuario ya está en uso.' });
        }

        // Encriptamos la contraseña y el codigo de 6 digitos con bcrypt antes de guardarlos
        const passwordHash = await bcrypt.hash(password, 10);
        const plainCode = generateSixDigitCode();
        const codeHash = await bcrypt.hash(plainCode, 10);

        // El codigo vence en 15 minutos (15 * 60 * 1000 milisegundos)
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Abrimos transaccion porque vamos a insertar en 3 tablas y si algo falla no queremos datos a medias
        await client.query('BEGIN');

        // Si habia registros viejos sin verificar con ese mismo correo o usuario, los limpiamos
        await userRepo.deleteUnverifiedUsersByEmailOrUsername(cleanEmail, cleanUsername, client);

        const newUserId = await userRepo.createUser({
            fullName: cleanFullName,
            username: cleanUsername,
            email: cleanEmail,
            passwordHash
        }, client);

        await legalRepo.createLegalAcceptance(newUserId, 'privacy_notice', PRIVACY_VERSION, client);
        await legalRepo.createLegalAcceptance(newUserId, 'terms', TERMS_VERSION, client);
        await codeRepo.createCode(newUserId, 'email_verification', codeHash, expiresAt, client);

        await client.query('COMMIT');

        // Mandamos el correo ya que se confirmo en base de datos
        try {
            await mailService.sendVerificationCodeEmail(cleanEmail, cleanFullName, plainCode, 'email_verification');
        } catch (mailError) {
            console.error('No se pudo mandar el correo de verificacion:', mailError);
            return res.status(201).json({
                message: 'Cuenta creada, pero hubo un problema al enviar el correo. Intenta reenviar el código.',
                email: cleanEmail
            });
        }

        return res.status(201).json({
            message: 'Registro exitoso. Te enviamos un código de 6 dígitos a tu correo.',
            email: cleanEmail
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en register:', error);
        return res.status(500).json({ message: 'Ocurrió un error al registrar la cuenta.' });
    } finally {
        // Siempre soltamos la conexion del pool al terminar, haya salido bien o mal
        client.release();
    }
}

// Verifica el codigo de 6 digitos que llego al correo y activa la cuenta
async function verifyEmail(req, res) {
    const client = await pool.connect();
    try {
        const { email, code } = req.body;

        if (!isValidEmail(email) || !isValidVerificationCode(code)) {
            return res.status(400).json({ message: 'El correo o el código de 6 dígitos no es válido.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const user = await userRepo.getUserByEmail(cleanEmail);

        if (!user) {
            return res.status(404).json({ message: 'No encontramos una cuenta con ese correo.' });
        }
        if (user.isVerified) {
            return res.status(400).json({ message: 'Esta cuenta ya fue verificada anteriormente.' });
        }

        const activeCode = await codeRepo.getLatestActiveCode(user.id, 'email_verification');
        if (!activeCode) {
            return res.status(400).json({ message: 'No hay ningún código activo. Solicita uno nuevo.' });
        }

        // Revisamos si ya se pasaron los 15 minutos o si ya gasto sus 5 intentos
        if (new Date(activeCode.expiresAt) <= new Date()) {
            return res.status(400).json({ message: 'El código ya venció. Solicita uno nuevo.' });
        }
        if (activeCode.attempts >= 5) {
            return res.status(400).json({ message: 'Superaste el límite de intentos para este código. Solicita uno nuevo.' });
        }

        const isMatch = await bcrypt.compare(code, activeCode.codeHash);
        if (!isMatch) {
            await codeRepo.increaseCodeAttempts(activeCode.id);
            const remaining = 5 - (activeCode.attempts + 1);
            return res.status(400).json({
                message: remaining > 0
                    ? `Código incorrecto. Te quedan ${remaining} intentos.`
                    : 'Código incorrecto. Agotaste los intentos, solicita un código nuevo.'
            });
        }
        //Si no da error significa que si fue correcto y que si hizo match
        await client.query('BEGIN');
        await codeRepo.markCodeAsUsed(activeCode.id, client);
        await userRepo.markUserAsVerified(user.id, client);
        await client.query('COMMIT');

        // Iniciamos su sesion de una vez para que no tenga que volver a escribir su contraseña
        user.isVerified = true;
        setSessionCookie(res, user);

        return res.status(200).json({
            message: 'Correo verificado correctamente.',
            user: {
                id: user.id,
                fullName: user.fullName,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en verifyEmail:', error);
        return res.status(500).json({ message: 'Error al verificar el correo.' });
    } finally {
        client.release();
    }
}

// Reenvia un nuevo codigo de verificacion si no llego o vencio
async function resendVerificationCode(req, res) {
    try {
        const { email } = req.body;
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'El correo electrónico no es válido.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const user = await userRepo.getUserByEmail(cleanEmail);

        if (!user) {
            return res.status(404).json({ message: 'No encontramos una cuenta con ese correo.' });
        }
        if (user.isVerified) {
            return res.status(400).json({ message: 'Esta cuenta ya está verificada.' });
        }
        // Solo se puede reenviar pasados 60 segundos del ultimo envio
        // (el codigo dura 15 min, asi que restandolos sabemos cuando se mando)
        const lastCode = await codeRepo.getLatestActiveCode(user.id, 'email_verification');
        if (lastCode) {
            const sentAt = new Date(lastCode.expiresAt).getTime() - 15 * 60 * 1000;
            const secondsLeft = Math.ceil((sentAt + 60 * 1000 - Date.now()) / 1000);
            if (secondsLeft > 0) {
                return res.status(429).json({ message: `Espera ${secondsLeft} segundos para pedir otro código.` });
            }
        }
        // Control anti-spam: maximo 5 codigos en la ultima hora
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const sentLastHour = await codeRepo.countCodesSince(user.id, 'email_verification', oneHourAgo);
        if (sentLastHour >= 5) {
            return res.status(429).json({ message: 'Has solicitado demasiados códigos. Intenta de nuevo en una hora.' });
        }

        const plainCode = generateSixDigitCode();
        const codeHash = await bcrypt.hash(plainCode, 10);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Invalidamos los codigos anteriores que no se usaron y guardamos el nuevo
        await codeRepo.deleteUnusedCodes(user.id, 'email_verification');
        await codeRepo.createCode(user.id, 'email_verification', codeHash, expiresAt);

        await mailService.sendVerificationCodeEmail(cleanEmail, user.fullName, plainCode, 'email_verification');

        return res.status(200).json({ message: 'Te enviamos un nuevo código de verificación.' });
    } catch (error) {
        console.error('Error en resendVerificationCode:', error);
        return res.status(500).json({ message: 'No se pudo reenviar el código.' });
    }
}

// Inicio de sesion con bloqueo temporal tras 5 intentos fallidos
async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!isValidEmail(email) || typeof password !== 'string' || password.length === 0) {
            return res.status(400).json({ message: 'Ingresa tu correo y contraseña.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const user = await userRepo.getUserByEmail(cleanEmail);

        // Respondemos igual si no existe el correo para no revelar que correos tienen cuenta
        if (!user) {
            return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
        }

        // Si la cuenta esta bloqueada temporalmente revisamos si ya pasaron los 15 minutos
        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
            const minutesLeft = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
            return res.status(423).json({
                message: `Cuenta bloqueada temporalmente por intentos fallidos. Intenta en ${minutesLeft} minuto(s).`
            });
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            const attempts = await userRepo.increaseFailedLoginAttempts(user.id);
            if (attempts >= 5) {
                await userRepo.lockUser(user.id, 15);
                return res.status(423).json({
                    message: 'Demasiados intentos fallidos. Tu cuenta quedó bloqueada por 15 minutos.'
                });
            }
            return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: 'Aún no has verificado tu correo electrónico.',
                needsVerification: true,
                email: user.email
            });
        }

        // Si entro bien, reiniciamos el contador de intentos fallidos y creamos la cookie
        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
            await userRepo.resetLoginAttempts(user.id);
        }

        setSessionCookie(res, user);

        return res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            user: {
                id: user.id,
                fullName: user.fullName,
                username: user.username,
                role: user.role,
                avatarPath: user.avatarPath
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ message: 'Ocurrió un error al iniciar sesión.' });
    }
}

// Cierra la sesion borrando la cookie del navegador
function logout(req, res) {
    res.clearCookie(env.cookieName, {
        httpOnly: true,
        secure: env.cookieOptions.secure,
        sameSite: env.cookieOptions.sameSite
    });
    return res.status(200).json({ message: 'Sesión cerrada.' });
}

// Devuelve los datos de la sesion actual para que el frontend sepa quien esta logueado al recargar
async function getSession(req, res) {
    try {
        const user = await userRepo.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        return res.status(200).json({
            id: user.id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            role: user.role,
            avatarPath: user.avatarPath
        });
    } catch (error) {
        console.error('Error en getSession:', error);
        return res.status(500).json({ message: 'Error al obtener la sesión.' });
    }
}

// Solicita codigo de 6 digitos para recuperar contraseña olvidada
async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'El correo electrónico no es válido.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const user = await userRepo.getUserByEmail(cleanEmail);

        // Por seguridad respondemos el mismo mensaje exista o no el correo
        const genericMessage = 'Si el correo está registrado, recibirás un código de 6 dígitos para restablecer tu contraseña.';

        if (!user || !user.isVerified) {
            return res.status(200).json({ message: genericMessage });
        }

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const sentLastHour = await codeRepo.countCodesSince(user.id, 'password_reset', oneHourAgo);
        if (sentLastHour >= 5) {
            return res.status(429).json({ message: 'Has solicitado demasiados códigos. Intenta más tarde.' });
        }

        const plainCode = generateSixDigitCode();
        const codeHash = await bcrypt.hash(plainCode, 10);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await codeRepo.deleteUnusedCodes(user.id, 'password_reset');
        await codeRepo.createCode(user.id, 'password_reset', codeHash, expiresAt);

        await mailService.sendVerificationCodeEmail(cleanEmail, user.fullName, plainCode, 'password_reset');

        return res.status(200).json({ message: genericMessage });
    } catch (error) {
        console.error('Error en forgotPassword:', error);
        return res.status(500).json({ message: 'Error al procesar la solicitud.' });
    }
}

// Restablece la contraseña usando el codigo recibido por correo
async function resetPassword(req, res) {
    const client = await pool.connect();
    try {
        const { email, code, newPassword } = req.body;

        if (!isValidEmail(email) || !isValidVerificationCode(code)) {
            return res.status(400).json({ message: 'Correo o código inválido.' });
        }
        if (!isValidPassword(newPassword)) {
            return res.status(400).json({ message: 'La nueva contraseña debe tener de 8 a 64 caracteres, una mayúscula, una minúscula y un número.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const user = await userRepo.getUserByEmail(cleanEmail);
        if (!user || !user.isVerified) {
            return res.status(400).json({ message: 'No se pudo validar el código.' });
        }

        const activeCode = await codeRepo.getLatestActiveCode(user.id, 'password_reset');
        if (!activeCode || new Date(activeCode.expiresAt) <= new Date() || activeCode.attempts >= 5) {
            return res.status(400).json({ message: 'El código ya no es válido o venció. Solicita uno nuevo.' });
        }

        const isMatch = await bcrypt.compare(code, activeCode.codeHash);
        if (!isMatch) {
            await codeRepo.increaseCodeAttempts(activeCode.id);
            return res.status(400).json({ message: 'El código ingresado es incorrecto.' });
        }

        const newHash = await bcrypt.hash(newPassword, 10);

        await client.query('BEGIN');
        await codeRepo.markCodeAsUsed(activeCode.id, client);
        // Al actualizar contraseña tambien sube token_version, lo que invalida sesiones abiertas en otros lados
        await userRepo.updatePassword(user.id, newHash, client);
        await client.query('COMMIT');

        return res.status(200).json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en resetPassword:', error);
        return res.status(500).json({ message: 'Error al restablecer la contraseña.' });
    } finally {
        client.release();
    }
}

// Cambio de contraseña cuando el usuario ya esta dentro de su cuenta
async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (typeof currentPassword !== 'string' || !currentPassword) {
            return res.status(400).json({ message: 'Debes escribir tu contraseña actual.' });
        }
        if (!isValidPassword(newPassword)) {
            return res.status(400).json({ message: 'La nueva contraseña debe tener de 8 a 64 caracteres, una mayúscula, una minúscula y un número.' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'La nueva contraseña y su confirmación no coinciden.' });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({ message: 'La nueva contraseña no puede ser igual a la actual.' });
        }

        const user = await userRepo.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const isCurrentCorrect = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isCurrentCorrect) {
            return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await userRepo.updatePassword(user.id, newHash);

        // Le renovamos la cookie de este dispositivo con la nueva tokenVersion para no sacarlo de aqui
        const updatedUser = await userRepo.getUserById(user.id);
        setSessionCookie(res, updatedUser);

        return res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
    } catch (error) {
        console.error('Error en changePassword:', error);
        return res.status(500).json({ message: 'Error al cambiar la contraseña.' });
    }
}

module.exports = {
    register,
    verifyEmail,
    resendVerificationCode,
    login,
    logout,
    getSession,
    forgotPassword,
    resetPassword,
    changePassword
};