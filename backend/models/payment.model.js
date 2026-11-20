//Esta clase representa el registro de orden/captura de PayPal, esta es equivalente a la tabla "payments" en la base de datos
class Payment {
    constructor(
        id, userId, concept, projectId, amount, currency, paypalOrderId,
        paypalCaptureId, status, createdAt, completedAt,
        username = null, projectNickname = null
    ) {
        this.id = id;
        this.userId = userId;
        this.concept = concept; // 'pro_plan' | 'featured_7' | 'featured_30'
        this.projectId = projectId;
        this.amount = amount;
        this.currency = currency;
        this.paypalOrderId = paypalOrderId;
        this.paypalCaptureId = paypalCaptureId;
        this.status = status; // 'pending' | 'completed' | 'failed' | 'cancelled'
        this.createdAt = createdAt;
        this.completedAt = completedAt;
        this.username = username; // null si la cuenta fue eliminada
        this.projectNickname = projectNickname;
    }
}
module.exports = { Payment };