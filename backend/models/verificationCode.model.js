// Esta clase representa el codigo de 6 dígitos hasheado para verificar correo o recuperar contraseña
class VerificationCode {
    constructor(id, userId, purpose, codeHash, attempts, expiresAt, usedAt, createdAt) {
        this.id = id;
        this.userId = userId;
        this.purpose = purpose; // 'email_verification' | 'password_reset'
        this.codeHash = codeHash;
        this.attempts = attempts;
        this.expiresAt = expiresAt;
        this.usedAt = usedAt; // null mientras no se use
        this.createdAt = createdAt;
    }
}
module.exports = { VerificationCode };