# DevSail

DevSail es una plataforma web donde desarrolladores publican sus proyectos con el enlace a su repositorio, reciben calificaciones y comentarios de otros desarrolladores, y se dan a conocer.

## ¿Qué se puede hacer?

- Crear una cuenta, verificar el correo y completar el perfil.
- Publicar proyectos (GitHub, GitLab o Bitbucket) con imágenes y tecnologías.
- Explorar, buscar y filtrar proyectos.
- Calificar proyectos en 5 criterios, comentar y guardar favoritos.
- Reportar contenido inapropiado.
- Contratar el Plan Pro o destacar un proyecto con PayPal.
- Panel de administrador para moderar reportes, proyectos y comentarios.

## Tecnologías

- **Backend:** Node.js y Express
- **Base de datos:** PostgreSQL en Supabase
- **Imágenes:** Supabase Storage
- **Pagos:** PayPal
- **Frontend:** Angular

## Cómo correr el backend

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Crear un archivo `.env` con estas variables:
   ```
   PORT
   PROYECT_PRODUCTION
   FRONTEND_URL
   BACKEND_URL
   SESSION_POOLER_SUPABASE_URL
   JWT_SECRET
   JWT_EXPIRES_IN
   COOKIE_NAME
   SUPABASE_URL
   SUPABASE_SERVICE_KEY
   SUPABASE_BUCKET
   MAIL_USER
   MAIL_PASS
   PAYPAL_BASE_URL
   PAYPAL_CLIENT_ID
   PAYPAL_CLIENT_SECRET
   ```
3. Iniciar el servidor:
   ```bash
   node server.js
   ```

## Equipo

Lexordev, Dandelion y Verxhe.