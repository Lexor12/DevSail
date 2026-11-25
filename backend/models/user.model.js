// Cuenta completa de la tabla users, se usa en auth y al editar la cuenta
class User {
    constructor(
        id, fullName, username, email, passwordHash, role, isVerified, verifiedAt,
        bio, avatarPath, linkLinkedin, linkWebsite, linkGithub, linkGitlab,
        linkBitbucket, linkInstagram, linkYoutube, failedLoginAttempts,
        lockedUntil, tokenVersion, passwordChangedAt, createdAt, updatedAt
    ) {
        this.id = id;
        this.fullName = fullName;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.isVerified = isVerified;
        this.verifiedAt = verifiedAt; // puede ser null
        this.bio = bio; // puede ser null
        this.avatarPath = avatarPath; // ruta en Supabase Storage, con null se muestran las iniciales
        this.linkLinkedin = linkLinkedin;
        this.linkWebsite = linkWebsite;
        this.linkGithub = linkGithub;
        this.linkGitlab = linkGitlab;
        this.linkBitbucket = linkBitbucket;
        this.linkInstagram = linkInstagram;
        this.linkYoutube = linkYoutube;
        this.failedLoginAttempts = failedLoginAttempts;
        this.lockedUntil = lockedUntil; // puede ser null
        this.tokenVersion = tokenVersion;
        this.passwordChangedAt = passwordChangedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

// Datos minimos que se guardan en req.user despues de validar el token
class SessionUser {
    constructor(id, fullName, username, role, isVerified, tokenVersion) {
        this.id = id;
        this.fullName = fullName;
        this.username = username;
        this.role = role;
        this.isVerified = isVerified;
        this.tokenVersion = tokenVersion;
    }
}

// Perfil publico, nunca muestra correo, hash ni intentos fallidos
class PublicProfile {
    constructor(
        id, fullName, username, bio, avatarPath, linkLinkedin, linkWebsite,
        linkGithub, linkGitlab, linkBitbucket, linkInstagram, linkYoutube,
        isPro, createdAt
    ) {
        this.id = id;
        this.fullName = fullName;
        this.username = username;
        this.bio = bio;
        this.avatarPath = avatarPath;
        this.linkLinkedin = linkLinkedin;
        this.linkWebsite = linkWebsite;
        this.linkGithub = linkGithub;
        this.linkGitlab = linkGitlab;
        this.linkBitbucket = linkBitbucket;
        this.linkInstagram = linkInstagram;
        this.linkYoutube = linkYoutube;
        this.isPro = isPro;
        this.createdAt = createdAt;
    }
}
module.exports = { User, SessionUser, PublicProfile };