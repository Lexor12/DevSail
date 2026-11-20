// Punto de entrada del servidor: configura Express, CORS con cookies, rutas y la revision periodica de planes y destacados
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { env } = require('./config/env');

const authRoutes = require('./routes/auth.route');
const userRoutes = require('./routes/user.route');
const catalogRoutes = require('./routes/catalog.route');
const projectRoutes = require('./routes/project.route');
const ratingRoutes = require('./routes/rating.route');
const reportRoutes = require('./routes/report.route');
const paymentRoutes = require('./routes/payment.route');
const adminRoutes = require('./routes/admin.route');

const proRepo = require('./services/repositories/proSubscription.repository');
const featuredRepo = require('./services/repositories/featured.repository');
const projectRepo = require('./services/repositories/project.repository');

const app = express();

// Necesario en Render para que Express confie en el proxy HTTPS y las cookies secure funcionen bien
if (env.isProduction) {
    app.set('trust proxy', 1);
}

// Permitimos peticiones desde el frontend con envio de cookies (credentials: true)
app.use(cors({
    origin: env.frontendUrl,
    credentials: true
}));

// Subimos el limite del body a 30mb porque al publicar un proyecto se mandan hasta 5 imagenes en base64
app.use(express.json({ limit: '30mb' }));
app.use(cookieParser());

// Ruta rapida para verificar que el servidor esta vivo
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/catalogs', catalogRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Si llega una peticion con JSON mal formado o demasiado pesado
app.use((err, req, res, next) => {
    if (err && err.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Los archivos enviados son demasiado pesados.' });
    }
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ message: 'El formato JSON enviado no es válido.' });
    }
    console.error('Error no controlado:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
});

// Revisa cada hora si vencieron planes Pro o destacados y desactiva proyectos excedentes del limite gratuito (3)
async function runLifecycleMaintenance() {
    try {
        await proRepo.syncSubscriptionsLifecycle();
        await featuredRepo.syncFeaturedLifecycle();

        const projectIdsToDeactivate = await projectRepo.getProjectIdsToAutoDeactivate(3);
        if (projectIdsToDeactivate.length > 0) {
            await projectRepo.deactivateProjectsBatch(projectIdsToDeactivate);
        }
    } catch (error) {
        console.error('Error en el mantenimiento automatico de planes y destacados:', error);
    }
}

app.listen(env.port, () => {
    console.log(`Servidor DevSail corriendo en el puerto ${env.port}`);
    // Corremos una revision al encender y luego cada 60 minutos
    runLifecycleMaintenance();
    setInterval(runLifecycleMaintenance, 60 * 60 * 1000);
});
