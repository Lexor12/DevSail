//Tabla pro_subscriptions con las suscripciones Pro
class ProSubscription {
    constructor(id, userId, paymentId, startsAt, endsAt, status, createdAt) {
        this.id = id;
        this.userId = userId;
        this.paymentId = paymentId;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.status = status; // scheduled, active o expired
        this.createdAt = createdAt;
    }
}
module.exports = { ProSubscription };