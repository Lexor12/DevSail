//Esta clase representa a la tabla "pro_subscriptions" en la base de datos, que contiene la informacion de las suscripciones Pro de los usuarios
class ProSubscription {
    constructor(id, userId, paymentId, startsAt, endsAt, status, createdAt) {
        this.id = id;
        this.userId = userId;
        this.paymentId = paymentId;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.status = status; // 'scheduled' | 'active' | 'expired'
        this.createdAt = createdAt;
    }
}
module.exports = { ProSubscription };