// Codigo de 6 digitos hasheado para verificar el correo o recuperar la contraseña
class VerificationCode {
    constructor(id, userId, purpose, codeHash, attempts, expiresAt, usedAt, createdAt) {
        this.id = id;
        this.userId = userId;
        this.purpose = purpose; // email_verification o password_reset
        this.codeHash = codeHash;
        this.attempts = attempts;
        this.expiresAt = expiresAt;
        this.usedAt = usedAt; // null mientras no se use
        this.createdAt = createdAt;
    }
}
module.exports = { VerificationCode };