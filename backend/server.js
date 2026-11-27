// Aqui arranca el servidor con Express, CORS, las rutas y la revision de planes y destacados
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');//Encabezados de seguridad en todas las respuestas
const { rateLimit } = require('express-rate-limit');//Limita cuantas peticiones puede hacer cada IP
const cookieParser = require('cookie-parser');//El sitio debe usar cookies httpOnly para protegerse de XSS
const { env } = require('./config/env');
const swaggerUi = require('swagger-ui-express');

//Importamos las rutas para que la API pueda usarlas
const authRoutes = require('./routes/auth.route');
const userRoutes = require('./routes/user.route');
const catalogRoutes = require('./routes/catalog.route');
const projectRoutes = require('./routes/project.route');
const ratingRoutes = require('./routes/rating.route');
const reportRoutes = require('./routes/report.route');
const paymentRoutes = require('./routes/payment.route');
const adminRoutes = require('./routes/admin.route');
const proRepo = require('./services/repositories/proSubscription.service');
const featuredRepo = require('./services/repositories/featured.service');
const projectRepo = require('./services/repositories/project.service');

//Swagger necesita una configuracion, este archivo define las rutas, esquemas y descripciones para hacer pruebas
//asi que aqui lo importo para poder utilizarlo más adelante
const { swaggerDocument } = require('./config/swagger');

const app = express();//Creamos el objeto app para levantar la API

//Podemos correr el proyecto en desarrollo o en produccion, eso se define en el .env, de esta forma podemos usar en modo desarrollo funcionalidades únicas (o sea el Swagger)
if (env.isProduction) {
    // En Render hace falta para que Express confie en el proxy HTTPS y funcionen las cookies secure
    app.set('trust proxy', 1);
}

// Swagger solo se activa en desarrollo, para evitar que atacantes vean fácilmente 
if (!env.isProduction) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));//Aqui usamos el swaggerDocument que importamos
}

// Permitimos peticiones del frontend con cookies
app.use(cors({
    origin: env.frontendUrl,//Segun el .env puede ser localhost o nuestro hosting en produccion
    credentials: true//Para que se puedan manejar las cookies
}));

//Para poder desplegar un proyecto, este debe tener seguridad básica, asi que obte por usar Helmet, que evita ataques como XSS, clickjacking, sniffing de MIME y filtraciones
app.use(helmet({
    contentSecurityPolicy: false,// (y asi Swagger sigue funcionando en desarrollo)
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

//Ponemos un limite de 300 peticiones cada 15 minutos por IP para que no tumben el servidor, mediante algún ataque
app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Demasiadas peticiones. Espera unos minutos e intenta de nuevo.' }
}));

//Para evitar que atacantes hagan fuerza bruta con credenciales varias, aquí defini un limite de 20 peticiones en estos endpoints cada 15 minutos
//de esta forma no aplica los 300, siino 20 haciendo que un ataque de varios intentos no funcione debido a que tomaria muucho tiempo
app.use([
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/verify-email',
    '/api/auth/resend-code',
    '/api/auth/forgot-password',
    '/api/auth/reset-password'
], rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Demasiados intentos. Espera 15 minutos e intenta de nuevo.' }
}));

//Como se tiene permitido adjuntar máximo 4 imagenes de 2 MB en base64 para los proyectos, estos en teoria pesan unos 11 MB, con 12mb alcanza de sobra
// Un limite mas alto dejaria que alguien mande cuerpos enormes para saturar la memoria
app.use(express.json({ limit: '12mb' }));
app.use(cookieParser());//Permite leer las cookies que manda el navegador
//las separa en req.cookies y en req.signedCookies que son las firmadas

//Esta ruta permite ser usada para indicar el estado actual del servidor (si esta activo o no)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

//Agregamos las rutas de los otros archivos a la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/catalogs', catalogRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Errores por un JSON mal formado o demasiado pesado
app.use((err, req, res, next) => {
    //Este middleware maneja los errores de Express y responde segun el tipo
    if (err && err.type === 'entity.too.large') {//Si la solicitud es demasiado grande respondemos con error
        return res.status(413).json({ message: 'Los archivos enviados son demasiado pesados.' });
    }
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {//Si el formato no se puede procesar tambien marcamos error
        return res.status(400).json({ message: 'El formato JSON enviado no es válido.' });
    }
    //Si no es ninguno de esos lo tratamos como error interno
    return res.status(500).json({ message: 'Error interno del servidor.' });
});

//Necesitamos tareas cada 60 minutos, asi que usamos una funcion async
async function runLifecycleMaintenance() {
    try {
        // Vence planes Pro y destacados, y desactiva los proyectos que pasan del limite gratuito
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
    // Revisamos al encender y luego cada hora
    runLifecycleMaintenance();
    setInterval(runLifecycleMaintenance, 60 * 60 * 1000);
});
