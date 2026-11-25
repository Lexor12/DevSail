// Compras con PayPal del Plan Pro y de proyectos destacados,
// ademas del historial, la suscripcion y las estadisticas Pro
const pool = require('../config/db');
const { env } = require('../config/env');
const paypalService = require('../services/paypal/paypal.service');
const paymentRepo = require('../services/repositories/payment.service');
const proRepo = require('../services/repositories/proSubscription.service');
const featuredRepo = require('../services/repositories/featured.service');
const projectRepo = require('../services/repositories/project.service');
const userRepo = require('../services/repositories/user.service');
const visitRepo = require('../services/repositories/visit.service');
const mailService = require('../services/mail/mail.service');
const { isValidUuid } = require('../utils/validators');

// Precios en pesos mexicanos, siempre los define el servidor
const CATALOG_PRICES = {
    pro_plan: { amount: 119.00, days: 30, label: 'Plan Pro DevSail (30 días)' },
    featured_7: { amount: 149.00, days: 7, label: 'Proyecto Destacado (7 días)' },
    featured_30: { amount: 399.00, days: 30, label: 'Proyecto Destacado (30 días)' }
};

// Primer paso, crea la orden y devuelve el enlace de PayPal
async function createPayPalOrder(req, res) {
    try {
        const { concept, projectId } = req.body;
        const product = CATALOG_PRICES[concept];

        if (!product) {
            return res.status(400).json({ message: 'El concepto de pago no es válido.' });
        }

        // Para destacar, el proyecto debe ser suyo y estar publicado
        if (concept === 'featured_7' || concept === 'featured_30') {
            if (!isValidUuid(projectId)) {
                return res.status(400).json({ message: 'Debes seleccionar el proyecto que deseas destacar.' });
            }

            const project = await projectRepo.getProjectById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Proyecto no encontrado.' });
            }
            if (project.ownerId !== req.user.id) {
                return res.status(403).json({ message: 'Solo puedes destacar tus propios proyectos.' });
            }
            if (project.status !== 'published') {
                return res.status(400).json({ message: 'El proyecto debe estar publicado para poder destacarlo.' });
            }
        }

        // Armamos el objeto que pide la API de PayPal
        const orderPayload = {
            intent: 'CAPTURE',
            purchase_units: [
                {
                    description: product.label,
                    amount: {
                        currency_code: 'MXN',
                        value: product.amount.toFixed(2)
                    }
                }
            ],
            application_context: {
                brand_name: 'DevSail',
                landing_page: 'NO_PREFERENCE',
                user_action: 'PAY_NOW',
                return_url: `${env.frontendUrl}/payments/return`,
                cancel_url: `${env.frontendUrl}/payments/cancel`
            }
        };

        const paypalOrder = await paypalService.createOrder(orderPayload);

        // Guardamos la orden como pendiente antes de mandar al usuario a PayPal
        await paymentRepo.createPayment({
            userId: req.user.id,
            concept,
            projectId: concept === 'pro_plan' ? null : projectId,
            amount: product.amount,
            paypalOrderId: paypalOrder.id
        });

        // Buscamos el enlace approve para redirigir al usuario
        let approveUrl = null;
        if (Array.isArray(paypalOrder.links)) {
            const approveLink = paypalOrder.links.find(link => link.rel === 'approve');
            if (approveLink) {
                approveUrl = approveLink.href;
            }
        }

        return res.status(201).json({
            orderId: paypalOrder.id,
            approveUrl
        });
    } catch (error) {
        console.error('Error en createPayPalOrder:', error);
        return res.status(500).json({ message: 'No se pudo iniciar el pago con PayPal.' });
    }
}

// Segundo paso, ya que el usuario aprobo cobramos y activamos el beneficio
async function capturePayPalOrder(req, res) {
    const client = await pool.connect();
    let captureId = null;
    let capturedAmount = null;

    try {
        const { orderId } = req.body;
        if (typeof orderId !== 'string' || !orderId.trim()) {
            return res.status(400).json({ message: 'El ID de la orden de PayPal es obligatorio.' });
        }

        const cleanOrderId = orderId.trim();
        const payment = await paymentRepo.getPaymentByOrderId(cleanOrderId);

        if (!payment) {
            return res.status(404).json({ message: 'No encontramos esa orden de pago.' });
        }
        if (payment.userId !== req.user.id) {
            return res.status(403).json({ message: 'Esta orden de pago no pertenece a tu cuenta.' });
        }
        if (payment.status === 'completed') {
            return res.status(200).json({ message: 'Este pago ya había sido confirmado anteriormente.' });
        }

        // Cobramos la orden en PayPal
        const captureResult = await paypalService.capturePayment(cleanOrderId);
        if (captureResult.status !== 'COMPLETED') {
            await paymentRepo.setPaymentStatus(payment.id, 'failed');
            return res.status(400).json({ message: 'PayPal no confirmó la captura del pago.' });
        }

        // Guardamos el ID y el monto por si falla la base de datos y hay que reembolsar
        const purchaseUnit = captureResult.purchase_units && captureResult.purchase_units[0];
        const captureObj = purchaseUnit && purchaseUnit.payments && purchaseUnit.payments.captures && purchaseUnit.payments.captures[0];
        if (captureObj) {
            captureId = captureObj.id;
            capturedAmount = captureObj.amount;
        }

        const product = CATALOG_PRICES[payment.concept];

        // Guardamos la confirmacion y creamos la suscripcion o el destacado en una transaccion
        await client.query('BEGIN');

        await paymentRepo.markPaymentCompleted(payment.id, captureId, client);

        let activatedPeriod;
        if (payment.concept === 'pro_plan') {
            activatedPeriod = await proRepo.createProSubscription(req.user.id, product.days, payment.id, client);
        } else {
            activatedPeriod = await featuredRepo.createFeatured(payment.projectId, product.days, payment.id, client);
        }

        await client.query('COMMIT');

        // Mandamos el comprobante sin detener la respuesta si falla el correo
        try {
            const user = await userRepo.getUserById(req.user.id);
            const project = payment.projectId ? await projectRepo.getProjectById(payment.projectId) : null;
            if (user) {
                await mailService.sendPaymentReceiptEmail(user.email, user.fullName, {
                    conceptLabel: product.label,
                    projectNickname: project ? project.nickname : null,
                    amount: payment.amount,
                    paypalOrderId: cleanOrderId,
                    startsAt: new Date(activatedPeriod.startsAt).toLocaleString('es-MX'),
                    endsAt: new Date(activatedPeriod.endsAt).toLocaleString('es-MX')
                });
            }
        } catch (mailError) {
            console.error('No se pudo mandar comprobante de pago:', mailError);
        }

        return res.status(200).json({
            message: 'Pago confirmado y beneficio activado.',
            startsAt: activatedPeriod.startsAt,
            endsAt: activatedPeriod.endsAt
        });
    } catch (error) {
        await client.query('ROLLBACK');

        // Si PayPal ya cobro pero fallo la base de datos, devolvemos el dinero
        if (captureId) {
            try {
                await paypalService.refundPayment(captureId, capturedAmount ? { amount: capturedAmount } : {});
            } catch (refundError) {
                console.error('URGENTE: Fallo reembolso automatico para captura:', captureId, refundError);
            }
        }

        console.error('Error en capturePayPalOrder:', error);
        return res.status(500).json({ message: 'Ocurrió un error al procesar el pago.' });
    } finally {
        client.release();
    }
}

// Marca la orden como cancelada si el usuario salio de PayPal sin pagar
async function cancelPayPalOrder(req, res) {
    try {
        const { orderId } = req.body;
        if (typeof orderId !== 'string' || !orderId.trim()) {
            return res.status(400).json({ message: 'El ID de la orden es obligatorio.' });
        }

        const payment = await paymentRepo.getPaymentByOrderId(orderId.trim());
        if (!payment || payment.userId !== req.user.id) {
            return res.status(404).json({ message: 'Orden no encontrada.' });
        }

        if (payment.status === 'pending') {
            await paymentRepo.setPaymentStatus(payment.id, 'cancelled');
        }

        return res.status(200).json({ message: 'Orden cancelada.' });
    } catch (error) {
        console.error('Error en cancelPayPalOrder:', error);
        return res.status(500).json({ message: 'Error al cancelar la orden.' });
    }
}

// Estado del Plan Pro e historial de compras del usuario
async function getMySubscriptionAndPayments(req, res) {
    try {
        const [isPro, proEndsAt, payments] = await Promise.all([
            proRepo.isUserPro(req.user.id),
            proRepo.getCurrentOrScheduledEnd(req.user.id),
            paymentRepo.getPaymentsByUser(req.user.id)
        ]);

        return res.status(200).json({
            isPro,
            proEndsAt,
            payments,
            prices: CATALOG_PRICES
        });
    } catch (error) {
        console.error('Error en getMySubscriptionAndPayments:', error);
        return res.status(500).json({ message: 'Error al cargar tus suscripciones y pagos.' });
    }
}

// Estadisticas de visitas, solo con Plan Pro activo
async function getProAnalytics(req, res) {
    try {
        const isPro = await proRepo.isUserPro(req.user.id);
        if (!isPro) {
            return res.status(403).json({ message: 'Las estadísticas detalladas son exclusivas del Plan Pro.' });
        }

        // Se permiten 7, 30 o 90 dias y por defecto son 30
        const rawDays = Number(req.query.days);
        const days = rawDays === 7 || rawDays === 90 ? rawDays : 30;

        const projectId = req.query.projectId && isValidUuid(req.query.projectId) ? req.query.projectId : null;

        const [dailySeries, projectsBreakdown] = await Promise.all([
            visitRepo.getDailyVisitsSeries(req.user.id, projectId, days),
            visitRepo.getProjectsVisitsBreakdown(req.user.id)
        ]);

        return res.status(200).json({
            days,
            dailySeries,
            projectsBreakdown
        });
    } catch (error) {
        console.error('Error en getProAnalytics:', error);
        return res.status(500).json({ message: 'Error al cargar las estadísticas.' });
    }
}

module.exports = {
    createPayPalOrder,
    capturePayPalOrder,
    cancelPayPalOrder,
    getMySubscriptionAndPayments,
    getProAnalytics
};