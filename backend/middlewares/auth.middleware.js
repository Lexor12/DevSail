//este archivo revisa la cookie de sesion en cada peticion que entra a rutas protegidas,
// verifica que el token JWT sea valido, que la cuenta exista y que no se haya cambiado la contraseña
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { SessionUser } = require('../models/user.model');
const userRepo = require('../services/repositories/user.repository');

//obliga a que el usuario tenga sesion iniciada mediante la cookie httpOnly
async function verifyToken(req, res, next) {
    //limpiamos req.user por si alguien intento inyectar algo antes
    req.user = null;

    //cookieparser deja todas las cookies del navegador dentro de req.cookies
    const token = req.cookies ? req.cookies[env.cookieName] : null;
    if (!token) {
        return res.status(401).json({ message: 'Se requiere iniciar sesión.' });
    }

    try {
        const decoded = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });

        const user = await userRepo.getUserById(decoded.userId);
        if (!user || !user.isVerified) {
            return res.status(401).json({ message: 'Sesión inválida o cuenta no verificada.' });
        }

        //si el usuario cambio su contraseña en otro lado, tokenVersion sube y los tokens viejos dejan de servir
        if (user.tokenVersion !== decoded.tokenVersion) {
            return res.status(401).json({ message: 'Tu sesión expiró porque se cambió la contraseña. Inicia sesión de nuevo.' });
        }

        req.user = new SessionUser(
            user.id,
            user.fullName,
            user.username,
            user.role,
            user.isVerified,
            user.tokenVersion
        );

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Sesión inválida o expirada.' });
    }
}

//revisa si viene una cookie valida, pero si no viene o vencio deja pasar como visitante (req.user = null)
//sirve por ejemplo en el detalle de proyecto para saber si quien entra es el dueño o ya lo guardo
async function optionalAuth(req, res, next) {
    req.user = null;

    const token = req.cookies ? req.cookies[env.cookieName] : null;
    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
        const user = await userRepo.getUserById(decoded.userId);

        if (user && user.isVerified && user.tokenVersion === decoded.tokenVersion) {
            req.user = new SessionUser(
                user.id,
                user.fullName,
                user.username,
                user.role,
                user.isVerified,
                user.tokenVersion
            );
        }
    } catch (error) {
        //si el token viene vencido o dañado no bloqueamos la vista publica, solo entra como visitante
        req.user = null;
    }

    next();
}

//se usa después de verifyToken, tipo así mira: allowRoles('admin') o allowRoles('developer')
function allowRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
        }
        next();
    };
}

module.exports = {
    verifyToken,
    optionalAuth,
    allowRoles
};