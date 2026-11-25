// Rutas de compras con PayPal y estadisticas Pro
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { verifyToken, allowRoles } = require('../middlewares/auth.middleware');

// Estado del Plan Pro, historial de pagos y precios
router.get('/me', verifyToken, allowRoles('developer'), paymentController.getMySubscriptionAndPayments);

// Graficas de visitas, solo con Plan Pro
router.get('/pro-analytics', verifyToken, allowRoles('developer'), paymentController.getProAnalytics);

// Crea la orden en PayPal y devuelve el enlace
router.post('/paypal/create-order', verifyToken, allowRoles('developer'), paymentController.createPayPalOrder);

// Cobra el pago aprobado y activa el beneficio
router.post('/paypal/capture-order', verifyToken, allowRoles('developer'), paymentController.capturePayPalOrder);

// Cancela una orden pendiente
router.post('/paypal/cancel-order', verifyToken, allowRoles('developer'), paymentController.cancelPayPalOrder);

module.exports = router;