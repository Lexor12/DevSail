// Punto de entrada del servidor: configura Express, CORS con cookies, rutas y la revision periodica de planes y destacados
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');//El proyecto utiliza Cookies para evitar XSS
const { env } = require('./config/env');
const swaggerUi = require('swagger-ui-express');

//Importamos todas las rutas antes definidas, para que nuestra API pueda implementarlas
const authRoutes = require('./routes/auth.route');
const userRoutes = require('./routes/user.route');
const catalogRoutes = require('./routes/catalog.route');
const projectRoutes = require('./routes/project.route');
const ratingRoutes = require('./routes/rating.route');
const reportRoutes = require('./routes/report.route');
const paymentRoutes = require('./routes/payment.route');
const adminRoutes = require('./routes/admin.route');

//Aqui corregi el nombre de las rutas de los archivos, ya que no es repository, sino service
const proRepo = require('./services/repositories/proSubscription.service');
const featuredRepo = require('./services/repositories/featured.service');
const projectRepo = require('./services/repositories/project.service');

//Swagger por defecto requiere una configuración, este archivo define como debe funcionar, rutas disponibles, esquemas, descripciones y detalles para Testing
const { swaggerDocument } = require('./config/swagger');

//Instanciamos nuestro objeto de App para poder desplegar nuestra API
const app = express();

//Como el proyecto podemos estarlo ejecutando en 2 entornos (Producción y desarrollo), en el .env se define el estado
if (env.isProduction) {
    // Necesario en Render para que Express confie en el proxy HTTPS y las cookies secure funcionen bien
    app.set('trust proxy', 1);
}

// Habilitamos Swagger solo en desarrollo para probar endpoints desde http://localhost:3000/api-docs
if (!env.isProduction) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));//Aqui importamos la configuración de SwaggerDocument que justo importamos
}

// Permitimos peticiones desde el frontend con envio de cookies (credentials: true)
app.use(cors({
    origin: env.frontendUrl,//Este valor del .env puede hacer referencia a localhost o si estamos en Producción pues a nuestro hoster
    credentials: true//Para que pueda manejar las cookies
}));

// Subimos el limite del body a 30mb porque al publicar un proyecto se mandan hasta 5 imagenes en base64
app.use(express.json({ limit: '30mb' }));
app.use(cookieParser());//Habilita el middleware de cookie parser para leer las cookies enviadas por el navegador en req.headers.cookie
//tambien las convierte en cookies sin firmar (req.cookies) y req.signedCookies (cookies que si estan firmadas y son validas)

// Ruta rapida para verificar que el servidor esta vivo
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

//Agregamos las rutas definidas en otros archivos como adicionales a nuestra API
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
    //Este es otro mid, pero este se encarga del manejo de rrores de Express, este recibe el error y según el tipo hace una acción
    if (err && err.type === 'entity.too.large') {//Si una solicitud es demasiado grande, retorna error
        return res.status(413).json({ message: 'Los archivos enviados son demasiado pesados.' });
    }
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {//Si envia un formato no procesable, marcamos error
        return res.status(400).json({ message: 'El formato JSON enviado no es válido.' });
    }
    //Si al final no podemos manejar el error, podemos considerarlo como interno
    return res.status(500).json({ message: 'Error interno del servidor.' });
});

//Necesitamos Jobs para hacer tareas cada 60 minutos, asi que creamos una función async que se ejecuta en otro hilo cada 60

async function runLifecycleMaintenance() {
    try {
        // Revisa cada hora si vencieron planes Pro o destacados y desactiva proyectos excedentes del limite gratuito (3)
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
