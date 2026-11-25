// Aqui juntamos las variables de entorno para no leer process.env en todos los archivos
require('dotenv').config();

const isProduction = process.env.PROYECT_PRODUCTION === 'true';

const env = {
    port: Number(process.env.PORT),
    isProduction,
    frontendUrl: process.env.FRONTEND_URL,
    backendUrl: process.env.BACKEND_URL,
    databaseUrl: process.env.SESSION_POOLER_SUPABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    cookieName: process.env.COOKIE_NAME,
    // En local la cookie funciona con HTTP y en Render permite peticiones desde Netlify
    cookieOptions: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 8 * 60 * 60 * 1000 // 8 horas, igual que el JWT
    },
    supabase: {
        url: process.env.SUPABASE_URL,
        serviceKey: process.env.SUPABASE_SERVICE_KEY,
        bucket: process.env.SUPABASE_BUCKET,
        // Direccion publica del bucket, se antepone a las rutas guardadas en la base de datos
        mediaBaseUrl: process.env.SUPABASE_MEDIA_BASE_URL
    },
    mail: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    },
    paypal: {
        baseUrl: process.env.PAYPAL_BASE_URL,
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET
    }
};

module.exports = { env };