// Este archivo maneja el perfil publico de los desarrolladores, la edicion de datos personales y enlaces,
// la subida o borrado de foto de perfil, y la eliminacion definitiva de la cuenta.
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { env } = require('../config/env');
const userRepo = require('../services/repositories/user.service');
const projectRepo = require('../services/repositories/project.service');
const ratingRepo = require('../services/repositories/rating.service');
const statsRepo = require('../services/repositories/stats.service');
const imageRepo = require('../services/repositories/projectImage.service');
const storageService = require('../services/bucket/storage.service');
const mailService = require('../services/mail/mail.service');
const {
    isValidFullName,
    isValidUsername,
    isValidLength,
    isValidProfileLink
} = require('../utils/validators');

// Limite de 1 MB para foto de perfil
const MAX_AVATAR_BYTES = 1 * 1024 * 1024;

// Devuelve el perfil publico de un desarrollador (/u/:username) junto con sus estadisticas y proyectos
async function getPublicProfile(req, res) {
    try {
        const username = (req.params.username || '').trim().toLowerCase();
        const sortBy = req.query.sortBy === 'rated' ? 'rated' : 'recent';

        if (!isValidUsername(username)) {
            return res.status(404).json({ message: 'Perfil no encontrado.' });
        }

        const profile = await userRepo.getPublicProfileByUsername(username);
        if (!profile) {
            return res.status(404).json({ message: 'Perfil no encontrado.' });
        }

        // Ejecutamos estadisticas y lista de proyectos al mismo tiempo porque no dependen una de la otra
        const [stats, projects] = await Promise.all([
            statsRepo.getProfileStats(profile.id),
            projectRepo.getPublishedProjectsByOwner(profile.id, sortBy)
        ]);

        return res.status(200).json({
            profile,
            stats,
            projects
        });
    } catch (error) {
        console.error('Error en getPublicProfile:', error);
        return res.status(500).json({ message: 'Error al cargar el perfil.' });
    }
}

// Devuelve los datos completos de mi propia cuenta para llenar el formulario de editar perfil
async function getMyAccount(req, res) {
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
            bio: user.bio,
            avatarPath: user.avatarPath,
            linkLinkedin: user.linkLinkedin,
            linkWebsite: user.linkWebsite,
            linkGithub: user.linkGithub,
            linkGitlab: user.linkGitlab,
            linkBitbucket: user.linkBitbucket,
            linkInstagram: user.linkInstagram,
            linkYoutube: user.linkYoutube,
            createdAt: user.createdAt
        });
    } catch (error) {
        console.error('Error en getMyAccount:', error);
        return res.status(500).json({ message: 'Error al obtener los datos de la cuenta.' });
    }
}

// Actualiza nombre, usuario, biografia y enlaces sociales del usuario logueado
async function updateProfile(req, res) {
    try {
        const {
            fullName, username, bio, linkLinkedin, linkWebsite,
            linkGithub, linkGitlab, linkBitbucket, linkInstagram, linkYoutube
        } = req.body;

        if (!isValidFullName(fullName)) {
            return res.status(400).json({ message: 'El nombre completo debe tener entre 2 y 80 letras.' });
        }
        if (!isValidUsername(username)) {
            return res.status(400).json({ message: 'El nombre de usuario no es válido (3 a 20 caracteres, minúsculas, números o _).' });
        }
        if (bio !== null && bio !== undefined && bio !== '' && !isValidLength(bio, 1, 300)) {
            return res.status(400).json({ message: 'La biografía no puede superar los 300 caracteres.' });
        }

        // Revisamos que cada enlace opcional pertenezca a la plataforma que dice
        if (!isValidProfileLink(linkLinkedin, ['linkedin.com'])) {
            return res.status(400).json({ message: 'El enlace de LinkedIn debe empezar con https://linkedin.com' });
        }
        if (!isValidProfileLink(linkWebsite, [])) {
            return res.status(400).json({ message: 'El enlace del sitio web debe empezar con https://' });
        }
        if (!isValidProfileLink(linkGithub, ['github.com'])) {
            return res.status(400).json({ message: 'El enlace de GitHub debe empezar con https://github.com' });
        }
        if (!isValidProfileLink(linkGitlab, ['gitlab.com'])) {
            return res.status(400).json({ message: 'El enlace de GitLab debe empezar con https://gitlab.com' });
        }
        if (!isValidProfileLink(linkBitbucket, ['bitbucket.org'])) {
            return res.status(400).json({ message: 'El enlace de Bitbucket debe empezar con https://bitbucket.org' });
        }
        if (!isValidProfileLink(linkInstagram, ['instagram.com'])) {
            return res.status(400).json({ message: 'El enlace de Instagram debe empezar con https://instagram.com' });
        }
        if (!isValidProfileLink(linkYoutube, ['youtube.com', 'youtu.be'])) {
            return res.status(400).json({ message: 'El enlace de YouTube debe empezar con https://youtube.com' });
        }

        const cleanUsername = username.trim().toLowerCase();
        const existingUser = await userRepo.getUserByUsername(cleanUsername);

        // Si alguien mas ya tiene ese username (y es cuenta verificada), no se puede usar
        if (existingUser && existingUser.id !== req.user.id && existingUser.isVerified) {
            return res.status(409).json({ message: 'Ese nombre de usuario ya está ocupado.' });
        }

        // Convertimos strings vacios en null para que en la BD quede limpio
        const cleanOrNull = (value) => (typeof value === 'string' && value.trim() !== '' ? value.trim() : null);

        await userRepo.updateUserProfile(req.user.id, {
            fullName: fullName.trim(),
            username: cleanUsername,
            bio: cleanOrNull(bio),
            linkLinkedin: cleanOrNull(linkLinkedin),
            linkWebsite: cleanOrNull(linkWebsite),
            linkGithub: cleanOrNull(linkGithub),
            linkGitlab: cleanOrNull(linkGitlab),
            linkBitbucket: cleanOrNull(linkBitbucket),
            linkInstagram: cleanOrNull(linkInstagram),
            linkYoutube: cleanOrNull(linkYoutube)
        });

        return res.status(200).json({ message: 'Perfil actualizado correctamente.' });
    } catch (error) {
        console.error('Error en updateProfile:', error);
        return res.status(500).json({ message: 'Error al actualizar el perfil.' });
    }
}

// Sube o reemplaza la foto de perfil en Supabase Storage
async function updateAvatar(req, res) {
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ message: 'Debes enviar una imagen.' });
        }

        // Validamos peso y firma real del archivo (jpg, png o webp)
        let decoded;
        try {
            decoded = storageService.decodeAndValidateImage(image, MAX_AVATAR_BYTES);
        } catch (validationError) {
            return res.status(400).json({ message: validationError.message });
        }

        const user = await userRepo.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const oldAvatarPath = user.avatarPath;

        // Primero subimos la nueva y actualizamos la BD; hasta el final borramos la vieja por si algo falla
        const newAvatarPath = await storageService.uploadImage(
            'avatars',
            decoded.buffer,
            decoded.extension,
            decoded.mimeType
        );

        await userRepo.updateAvatarPath(user.id, newAvatarPath);

        if (oldAvatarPath) {
            await storageService.deleteImages(oldAvatarPath);
        }

        return res.status(200).json({
            message: 'Foto de perfil actualizada.',
            avatarPath: newAvatarPath
        });
    } catch (error) {
        console.error('Error en updateAvatar:', error);
        return res.status(500).json({ message: 'Error al actualizar la foto de perfil.' });
    }
}

// Quita la foto de perfil para volver a mostrar iniciales
async function removeAvatar(req, res) {
    try {
        const user = await userRepo.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const oldAvatarPath = user.avatarPath;
        await userRepo.updateAvatarPath(user.id, null);

        if (oldAvatarPath) {
            await storageService.deleteImages(oldAvatarPath);
        }

        return res.status(200).json({ message: 'Foto de perfil eliminada.' });
    } catch (error) {
        console.error('Error en removeAvatar:', error);
        return res.status(500).json({ message: 'Error al eliminar la foto de perfil.' });
    }
}

// Elimina la cuenta del desarrollador definitivamente pidiendo su contraseña actual
async function deleteAccount(req, res) {
    const client = await pool.connect();
    try {
        const { password } = req.body;
        if (typeof password !== 'string' || !password) {
            return res.status(400).json({ message: 'Debes confirmar tu contraseña para eliminar tu cuenta.' });
        }

        const user = await userRepo.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // El administrador no puede borrar su cuenta desde aqui
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'La cuenta de administrador no puede eliminarse.' });
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(401).json({ message: 'La contraseña ingresada es incorrecta.' });
        }

        // Juntamos todas las rutas de imagenes en Storage que hay que borrar (avatar + fotos de sus proyectos)
        const pathsToDelete = [];
        if (user.avatarPath) {
            pathsToDelete.push(user.avatarPath);
        }

        const myProjects = await projectRepo.getProjectsByOwner(user.id);
        for (let i = 0; i < myProjects.length; i++) {
            const images = await imageRepo.getImagesByProject(myProjects[i].id);
            for (let j = 0; j < images.length; j++) {
                pathsToDelete.push(images[j].storagePath);
            }
        }

        // Guardamos los IDs de proyectos donde este usuario habia calificado para recalcular sus promedios despues
        const ratedProjectIds = await ratingRepo.getProjectIdsRatedByUser(user.id);

        await client.query('BEGIN');

        // Al borrar el usuario, ON DELETE CASCADE limpia sus proyectos, calificaciones, guardados y suscripciones
        await userRepo.deleteUser(user.id, client);

        // Recalculamos los promedios de los proyectos ajenos donde este usuario habia dejado calificacion
        for (let i = 0; i < ratedProjectIds.length; i++) {
            await projectRepo.recalculateProjectRatings(ratedProjectIds[i], client);
        }

        await client.query('COMMIT');

        // Limpiamos archivos del bucket y cerramos cookie
        await storageService.deleteImages(pathsToDelete);
        res.clearCookie(env.cookieName, {
            httpOnly: true,
            secure: env.cookieOptions.secure,
            sameSite: env.cookieOptions.sameSite
        });

        try {
            await mailService.sendAccountDeletedEmail(user.email, user.fullName);
        } catch (mailError) {
            console.error('No se pudo mandar correo de cuenta eliminada:', mailError);
        }

        return res.status(200).json({ message: 'Tu cuenta ha sido eliminada definitivamente.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en deleteAccount:', error);
        return res.status(500).json({ message: 'Error al eliminar la cuenta.' });
    } finally {
        client.release();
    }
}

module.exports = {
    getPublicProfile,
    getMyAccount,
    updateProfile,
    updateAvatar,
    removeAvatar,
    deleteAccount
};