// Consultas de usuarios por id, correo o nombre de usuario y el perfil publico
const pool = require('../../config/db');
const {User, PublicProfile} = require('../../models/user.model');

const USER_COLUMNS = `
    id, full_name AS "fullName", username, email, password_hash AS "passwordHash", role,
    is_verified AS "isVerified", verified_at AS "verifiedAt", bio, avatar_path AS "avatarPath",
    link_linkedin AS "linkLinkedin", link_website AS "linkWebsite", link_github AS "linkGithub",
    link_gitlab AS "linkGitlab", link_bitbucket AS "linkBitbucket", link_instagram AS "linkInstagram",
    link_youtube AS "linkYoutube", failed_login_attempts AS "failedLoginAttempts",
    locked_until AS "lockedUntil", token_version AS "tokenVersion",
    password_changed_at AS "passwordChangedAt", created_at AS "createdAt", updated_at AS "updatedAt"
`;

function mapUser(r) {
    return new User(
        r.id, r.fullName, r.username, r.email, r.passwordHash, r.role, r.isVerified, r.verifiedAt,
        r.bio, r.avatarPath, r.linkLinkedin, r.linkWebsite, r.linkGithub, r.linkGitlab,
        r.linkBitbucket, r.linkInstagram, r.linkYoutube, r.failedLoginAttempts,
        r.lockedUntil, r.tokenVersion, r.passwordChangedAt, r.createdAt, r.updatedAt
    );
}

async function getUserById(userId, db = pool) {
    const result = await db.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [userId]);
    return result.rows.length > 0 ? mapUser(result.rows[0]) : null;
}

async function getUserByEmail(email, db = pool) {
    const result = await db.query(`SELECT ${USER_COLUMNS} FROM users WHERE email = $1`, [email]);
    return result.rows.length > 0 ? mapUser(result.rows[0]) : null;
}

async function getUserByUsername(username, db = pool) {
    const result = await db.query(`SELECT ${USER_COLUMNS} FROM users WHERE username = $1`, [username]);
    return result.rows.length > 0 ? mapUser(result.rows[0]) : null;
}

// Perfil publico, solo cuentas verificadas, sin correo y con insignia si es Pro
async function getPublicProfileByUsername(username, db = pool) {
    const sentence = `
        SELECT
            u.id, u.full_name AS "fullName", u.username, u.bio, u.avatar_path AS "avatarPath",
            u.link_linkedin AS "linkLinkedin", u.link_website AS "linkWebsite",
            u.link_github AS "linkGithub", u.link_gitlab AS "linkGitlab",
            u.link_bitbucket AS "linkBitbucket", u.link_instagram AS "linkInstagram",
            u.link_youtube AS "linkYoutube",
            EXISTS (
                SELECT 1 FROM pro_subscriptions s
                WHERE s.user_id = u.id AND s.status = 'active' AND s.starts_at <= NOW() AND s.ends_at > NOW()
            ) AS "isPro",
            u.created_at AS "createdAt"
        FROM users u
        WHERE u.username = $1 AND u.is_verified = TRUE
    `;
    const result = await db.query(sentence, [username]);
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return new PublicProfile(
        r.id, r.fullName, r.username, r.bio, r.avatarPath, r.linkLinkedin, r.linkWebsite,
        r.linkGithub, r.linkGitlab, r.linkBitbucket, r.linkInstagram, r.linkYoutube,
        r.isPro, r.createdAt
    );
}
//Crea una cuenta sin verificar y devuelve su id
async function createUser(data, db = pool) {
    const sentence = `
        INSERT INTO users (full_name, username, email, password_hash)
        VALUES ($1, $2, $3, $4)
        RETURNING id
    `;//No hace falta mandar el rol porque por defecto es developer
    //Tampoco indicamos si esta verificado porque eso se hace despues de crearla
    const result = await db.query(sentence, [data.fullName, data.username, data.email, data.passwordHash]);
    return result.rows[0].id;
}
// Borramos cuentas sin verificar con el mismo correo o usuario para que no bloqueen el registro
async function deleteUnverifiedUsersByEmailOrUsername(email, username, db = pool) {
    await db.query(
        `DELETE FROM users WHERE is_verified = FALSE AND (email = $1 OR username = $2)`,
        [email, username]
    );
}
//Marca a un usuario como verificado
//Se llama cuando el codigo fue correcto
async function markUserAsVerified(userId, db = pool) {
    await db.query(
        `UPDATE users SET is_verified = TRUE, verified_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [userId]
    );
}
//Actualiza los datos del perfil
async function updateUserProfile(userId, data, db = pool) {
    const sentence = `
        UPDATE users SET
            full_name = $2, username = $3, bio = $4, link_linkedin = $5, link_website = $6,
            link_github = $7, link_gitlab = $8, link_bitbucket = $9, link_instagram = $10,
            link_youtube = $11, updated_at = NOW()
        WHERE id = $1
    `;
    await db.query(sentence, [
        userId, data.fullName, data.username, data.bio, data.linkLinkedin, data.linkWebsite,
        data.linkGithub, data.linkGitlab, data.linkBitbucket, data.linkInstagram, data.linkYoutube
    ]);
}
//Al cambiar la foto solo actualizamos su ruta y el navegador muestra la imagen nueva
async function updateAvatarPath(userId, avatarPath, db = pool) {
    await db.query(`UPDATE users SET avatar_path = $2, updated_at = NOW() WHERE id = $1`, [userId, avatarPath]);
}

// Al cambiar la contraseña sube token_version para cerrar las otras sesiones
async function updatePassword(userId, passwordHash, db = pool) {
    const sentence = `
        UPDATE users SET
            password_hash = $2,
            token_version = token_version + 1,
            password_changed_at = NOW(),
            failed_login_attempts = 0,
            locked_until = NULL,
            updated_at = NOW()
        WHERE id = $1
    `;
    await db.query(sentence, [userId, passwordHash]);
}

//Suma un intento fallido, al llegar a 5 la cuenta se bloquea 15 minutos
async function increaseFailedLoginAttempts(userId, db = pool) {
    const result = await db.query(
        `UPDATE users SET failed_login_attempts = LEAST(failed_login_attempts + 1, 5) WHERE id = $1 RETURNING failed_login_attempts AS attempts`,
        [userId]
    );
    return result.rows[0].attempts;
}
//Bloquea al usuario unos minutos cuando se pasa de intentos
async function lockUser(userId, minutes, db = pool) {
    await db.query(
        `UPDATE users SET failed_login_attempts = 0, locked_until = NOW() + ($2::int * INTERVAL '1 minute') WHERE id = $1`,
        [userId, minutes]
    );
}
//Reinicia los intentos y desbloquea la cuenta cuando inicia sesion bien
async function resetLoginAttempts(userId, db = pool) {
    await db.query(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1`, [userId]);
}
//Elimina un usuario
async function deleteUser(userId, db = pool) {
    await db.query(`DELETE FROM users WHERE id = $1`, [userId]);
}

//Exportamos las funciones para los controllers
module.exports = {
    getUserById, getUserByEmail, getUserByUsername, getPublicProfileByUsername,
    createUser, deleteUnverifiedUsersByEmailOrUsername, markUserAsVerified,
    updateUserProfile, updateAvatarPath, updatePassword,
    increaseFailedLoginAttempts, lockUser, resetLoginAttempts, deleteUser
};