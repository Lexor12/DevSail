// Este archivo contiene funciones para obtener usuarios de la base de datos, incluyendo funciones para obtener un usuario por id, email o username, y una función para obtener el perfil publico de un usuario por username
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

// Perfil publico: solo cuentas verificadas, sin correo y con insignia Pro si tiene suscripcion vigente
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
//Esta función permite crear un nuevo usuario en la base de datos, y devuelve el id del usuario creado
// Crea la cuenta sin verificar y devuelve su UUID
async function createUser(data, db = pool) {
    const sentence = `
        INSERT INTO users (full_name, username, email, password_hash)
        VALUES ($1, $2, $3, $4)
        RETURNING id
    `;//No es necesario pasar el rol, ya que por defecto es 'developer'
    //No indicamos si fue verificado, ya que eso se realiza después, primero se crea y después se verifica, si es incorrecto, entonces se borra la cuenta
    const result = await db.query(sentence, [data.fullName, data.username, data.email, data.passwordHash]);
    return result.rows[0].id;
}
// Si el correo o usuario pertenecia a cuentas sin verificar las eliminamos para evitar que se bloquee el registro de un nuevo usuario con esos datos
async function deleteUnverifiedUsersByEmailOrUsername(email, username, db = pool) {
    await db.query(
        `DELETE FROM users WHERE is_verified = FALSE AND (email = $1 OR username = $2)`,
        [email, username]
    );
}
//Esta es la función que usamos para marcar a un usuario como verificado
//Esta se llama en la pantalla de codigo cuando este fue adecuado
async function markUserAsVerified(userId, db = pool) {
    await db.query(
        `UPDATE users SET is_verified = TRUE, verified_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [userId]
    );
}
//Esta función es la que permite actualizar los datos del perfil de un usuario 
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
//Cuando agregamos una nueva imagen, como todas las imagenes llevan un path, entonces simplemente actualizamos el path de la imagen en la base de datos, de tal forma que cuando el usuario la solicite, pues solo el navegador muestra la imagen del path
async function updateAvatarPath(userId, avatarPath, db = pool) {
    await db.query(`UPDATE users SET avatar_path = $2, updated_at = NOW() WHERE id = $1`, [userId, avatarPath]);
}

// Al cambiar contraseña se incrementa token_version para cerrar sesiones en otros dispositivos
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

//Esta función permite aumentar el numero de intentos fallidos de inicio de sesion, y si llega a 5, entonces bloquea la cuenta por 15 minutos
async function increaseFailedLoginAttempts(userId, db = pool) {
    const result = await db.query(
        `UPDATE users SET failed_login_attempts = LEAST(failed_login_attempts + 1, 5) WHERE id = $1 RETURNING failed_login_attempts AS attempts`,
        [userId]
    );
    return result.rows[0].attempts;
}
//Esta es la función que permite bloquear a un usuario por un tiempo determinado, en minutos, y se usa cuando el usuario ha excedido el numero de intentos fallidos de inicio de sesion
async function lockUser(userId, minutes, db = pool) {
    await db.query(
        `UPDATE users SET failed_login_attempts = 0, locked_until = NOW() + ($2::int * INTERVAL '1 minute') WHERE id = $1`,
        [userId, minutes]
    );
}
//Esta función permite resetear los intentos fallidos de inicio de sesion, y desbloquear la cuenta si estaba bloqueada, y se usa cuando el usuario ha iniciado sesion correctamente
async function resetLoginAttempts(userId, db = pool) {
    await db.query(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1`, [userId]);
}
//Esta es la función que permite eliminar un usuario de la base de datos directamente
async function deleteUser(userId, db = pool) {
    await db.query(`DELETE FROM users WHERE id = $1`, [userId]);
}

//Para poder usar las funciones por los controllers, debemos exportarlas
module.exports = {
    getUserById, getUserByEmail, getUserByUsername, getPublicProfileByUsername,
    createUser, deleteUnverifiedUsersByEmailOrUsername, markUserAsVerified,
    updateUserProfile, updateAvatarPath, updatePassword,
    increaseFailedLoginAttempts, lockUser, resetLoginAttempts, deleteUser
};