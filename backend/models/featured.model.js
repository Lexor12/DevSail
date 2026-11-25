// Tabla featured_projects con los destacados, su pago y su duracion
// Pueden ser de 7 o de 30 dias
class FeaturedProject {
    constructor(
        id, projectId, paymentId, durationDays, startsAt, endsAt, status,
        removedReason, removedAt, removedBy, createdAt,
        projectNickname = null, ownerUsername = null
    ) {
        this.id = id;
        this.projectId = projectId;
        this.paymentId = paymentId;
        this.durationDays = durationDays;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.status = status; // scheduled, active, expired o removed
        this.removedReason = removedReason;
        this.removedAt = removedAt;
        this.removedBy = removedBy;
        this.createdAt = createdAt;
        this.projectNickname = projectNickname;
        this.ownerUsername = ownerUsername;
    }
}
module.exports = { FeaturedProject };