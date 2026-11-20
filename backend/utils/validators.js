// Funciones chiquitas de validación de formato, reutilizables en cualquier ruta
// Ninguna de estas toca la BD, solo revisan que el dato tenga la forma correcta

// Nombre completo: letras (con acentos y ñ) y espacios, de 2 a 80 caracteres
function isValidFullName(text) {
    if (typeof text !== 'string') return false;
    const clean = text.trim();
    if (clean.length < 2 || clean.length > 80) return false;
    const regex = /^[a-zA-ZÀ-ÿñÑ\s]+$/;
    return regex.test(clean);
}

// Nombre de usuario: solo minúsculas, números y guion bajo, de 3 a 20 caracteres
function isValidUsername(text) {
    if (typeof text !== 'string') return false;
    const regex = /^[a-z0-9_]{3,20}$/;
    return regex.test(text);
}

// Formato estándar de correo electrónico, máximo 254 caracteres
function isValidEmail(text) {
    if (typeof text !== 'string') return false;
    if (text.length > 254) return false;
    const regex = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
    return regex.test(text);
}

// Contraseña: entre 8 y 64 caracteres, con al menos una letra mayúscula y al menos un número
function isValidPassword(text) {
    if (typeof text !== 'string') return false;
    if (text.length < 8 || text.length > 64) return false;

    const hasUppercase = /[A-ZÁÉÍÓÚÑ]/.test(text);
    const hasLowercase = /[a-záéíóúñ]/.test(text);
    const hasNumber = /[0-9]/.test(text);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
        return false;
    }
    return true;
}
// Nombre corto del proyecto: de 3 a 20 caracteres, solo letras, números, espacios, guion y punto
function isValidNickname(text) {
    if (typeof text !== 'string') return false;
    const regex = /^[a-zA-ZÀ-ÿñÑ0-9 .\-]{3,20}$/;
    return regex.test(text.trim());
}
// Código de verificación de 6 dígitos numéricos
function isValidVerificationCode(text) {
    if (typeof text !== 'string') return false;
    const regex = /^[0-9]{6}$/;
    return regex.test(text);
}

// Permite validar si un texto tiene una longitud dentro de un rango limpiando espacios
function isValidLength(text, min, max) {
    if (typeof text !== 'string') return false;
    const clean = text.trim();
    if (clean.length < min || clean.length > max) {
        return false;
    }
    return true;
}

// Valida que una URL sea http o https válida y no pase del límite de caracteres
function isValidHttpUrl(text, maxLength = 255) {
    if (typeof text !== 'string') return false;
    const clean = text.trim();
    if (clean.length === 0 || clean.length > maxLength) return false;

    try {
        const parsed = new URL(clean);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return false;
        }
        return true;
    } catch (error) {
        // Si new URL lanza error es porque el texto no tiene estructura de enlace
        return false;
    }
}

// Revisa la URL del repositorio y nos dice a qué plataforma pertenece ('github', 'gitlab' o 'bitbucket')
// Si no es de ninguna de las tres o no tiene usuario y nombre de repo, devuelve null
function getRepositoryPlatform(url) {
    if (!isValidHttpUrl(url, 255)) return null;

    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'https:') return null;

    const host = parsed.hostname.toLowerCase();
    // Quitamos diagonales al inicio y al final para contar las partes de la ruta (usuario/repositorio)
    const cleanPath = parsed.pathname.replace(/^\/+|\/+$/g, '');
    const segments = cleanPath.split('/');

    // Debe tener al menos usuario y nombre de proyecto (ejemplo: /lexordev/devsail)
    if (segments.length < 2 || !segments[0] || !segments[1]) {
        return null;
    }

    if (host === 'github.com' || host === 'www.github.com') return 'github';
    if (host === 'gitlab.com' || host === 'www.gitlab.com') return 'gitlab';
    if (host === 'bitbucket.org' || host === 'www.bitbucket.org') return 'bitbucket';

    return null;
}

// Valida los enlaces sociales del perfil: si viene vacío o null es válido (porque son opcionales)
// Si trae algo, revisamos que sea una URL https y del dominio que corresponde
function isValidProfileLink(url, allowedDomains) {
    if (url === null || url === undefined || url === '') return true;
    if (!isValidHttpUrl(url, 255)) return false;

    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'https:') return false;

    // Si no pasamos lista de dominios (como en el sitio web personal), con que sea https ya es válido
    if (!allowedDomains || allowedDomains.length === 0) {
        return true;
    }

    const host = parsed.hostname.toLowerCase();
    for (let i = 0; i < allowedDomains.length; i++) {
        const domain = allowedDomains[i];
        if (host === domain || host === `www.${domain}`) {
            return true;
        }
    }
    return false;
}

// Valida que una calificación individual sea un número entero del 1 al 5
function isValidScore(value) {
    if (value === null || value === undefined || value === '') return false;
    const number = Number(value);
    if (!Number.isInteger(number)) return false;
    if (number < 1 || number > 5) return false;
    return true;
}

// Valida si un número es entero mayor a 0 (sirve para páginas, límites, etc.)
function isValidPositiveInteger(value) {
    if (value === null || value === undefined || value === '') return false;
    const number = Number(value);
    if (!Number.isInteger(number) || number <= 0) {
        return false;
    }
    return true;
}

// Aquí validamos todos los IDs UUID de 36 caracteres para evitar errores antes de ir a la BD
function isValidUuid(text) {
    if (typeof text !== 'string') return false;
    const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return regex.test(text);
}

// Verifica que una fecha venga en formato yyyy-MM-dd y que sea una fecha real en el calendario
function isValidDate(text) {
    if (typeof text !== 'string') return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(text)) return false;

    const date = new Date(text);
    if (isNaN(date.getTime())) {
        return false;
    }
    return true;
}

// Exportamos todas las funciones para usarlas en los controllers
module.exports = {
    isValidFullName,
    isValidUsername,
    isValidEmail,
    isValidPassword,
    isValidVerificationCode,
    isValidLength,
    isValidHttpUrl,
    getRepositoryPlatform,
    isValidProfileLink,
    isValidScore,
    isValidPositiveInteger,
    isValidUuid,
    isValidDate,
    isValidNickname
};