// Rutas de compras con PayPal (Plan Pro y proyectos destacados) y estadisticas Pro
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { verifyToken, allowRoles } = require('../middlewares/auth.middleware');

// GET /api/payments/me, estado del Plan Pro, historial de pagos y precios actuales
router.get('/me', verifyToken, allowRoles('developer'), paymentController.getMySubscriptionAndPayments);

// GET /api/payments/pro-analytics, graficas y metricas de visitas (solo con Plan Pro activo)
router.get('/pro-analytics', verifyToken, allowRoles('developer'), paymentController.getProAnalytics);

// POST /api/payments/paypal/create-order, crea la orden en PayPal y devuelve la URL de aprobacion
router.post('/paypal/create-order', verifyToken, allowRoles('developer'), paymentController.createPayPalOrder);

// POST /api/payments/paypal/capture-order, captura el pago aprobado y activa el beneficio
router.post('/paypal/capture-order', verifyToken, allowRoles('developer'), paymentController.capturePayPalOrder);

// POST /api/payments/paypal/cancel-order, marca una orden pendiente como cancelada
router.post('/paypal/cancel-order', verifyToken, allowRoles('developer'), paymentController.cancelPayPalOrder);

module.exports = router;