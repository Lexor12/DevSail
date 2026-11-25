//Orden de PayPal, equivale a la tabla payments
class Payment {
    constructor(
        id, userId, concept, projectId, amount, currency, paypalOrderId,
        paypalCaptureId, status, createdAt, completedAt,
        username = null, projectNickname = null
    ) {
        this.id = id;
        this.userId = userId;
        this.concept = concept; // pro_plan, featured_7 o featured_30
        this.projectId = projectId;
        this.amount = amount;
        this.currency = currency;
        this.paypalOrderId = paypalOrderId;
        this.paypalCaptureId = paypalCaptureId;
        this.status = status; // pending, completed, failed o cancelled
        this.createdAt = createdAt;
        this.completedAt = completedAt;
        this.username = username; // null si la cuenta fue eliminada
        this.projectNickname = projectNickname;
    }
}
module.exports = { Payment };