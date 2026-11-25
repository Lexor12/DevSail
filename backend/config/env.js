// Carga y centraliza las variables de entorno para que ningun archivo lea process.env regado por todos lados
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
    // Configuracion de cookie: en local permite HTTP y localhost/127.0.0.1; en Render permite cross-site hacia Netlify
    cookieOptions: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 8 * 60 * 60 * 1000 // 8 horas (igual que el JWT)
    },
    supabase: {
        url: process.env.SUPABASE_URL,
        serviceKey: process.env.SUPABASE_SERVICE_KEY,
        bucket: process.env.SUPABASE_BUCKET
    },
    mail: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    },
    paypal: {
        baseUrl: process.env.PAYPAL_BASE_URL,
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET
    },
    supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    bucket: process.env.SUPABASE_BUCKET,
    mediaBaseUrl: process.env.SUPABASE_MEDIA_BASE_URL
    },
};

module.exports = { env };