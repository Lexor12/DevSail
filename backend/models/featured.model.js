// Esta clase representa de la base de datos la tabla "featured_projects", que contiene los proyectos destacados y su informacion de pago y duracion
// Que abarca los de 7 dias e incluye los de 30 dias
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
        this.status = status; // 'scheduled' | 'active' | 'expired' | 'removed'
        this.removedReason = removedReason;
        this.removedAt = removedAt;
        this.removedBy = removedBy;
        this.createdAt = createdAt;
        this.projectNickname = projectNickname;
        this.ownerUsername = ownerUsername;
    }
}
module.exports = { FeaturedProject };