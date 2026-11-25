// Funciones chiquitas para validar formatos en cualquier ruta
// Ninguna toca la base de datos, solo revisan la forma del dato

// Nombre completo con letras y espacios, de 2 a 80 caracteres
function isValidFullName(text) {
    if (typeof text !== 'string') return false;
    const clean = text.trim();
    if (clean.length < 2 || clean.length > 80) return false;
    const regex = /^[a-zA-ZÀ-ÿñÑ\s]+$/;
    return regex.test(clean);
}

// Usuario con minúsculas, números y guion bajo, de 3 a 20 caracteres
function isValidUsername(text) {
    if (typeof text !== 'string') return false;
    const regex = /^[a-z0-9_]{3,20}$/;
    return regex.test(text);
}

// Formato normal de correo, máximo 254 caracteres
function isValidEmail(text) {
    if (typeof text !== 'string') return false;
    if (text.length > 254) return false;
    const regex = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
    return regex.test(text);
}

// Contraseña de 8 a 64 caracteres con al menos una mayúscula y un número
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
// Nombre corto del proyecto de 3 a 20 caracteres con letras, números, espacios, guion y punto
function isValidNickname(text) {
    if (typeof text !== 'string') return false;
    const regex = /^[a-zA-ZÀ-ÿñÑ0-9 .\-]{3,20}$/;
    return regex.test(text.trim());
}
// Código de 6 números
function isValidVerificationCode(text) {
    if (typeof text !== 'string') return false;
    const regex = /^[0-9]{6}$/;
    return regex.test(text);
}

// Revisa que un texto sin espacios sobrantes tenga el largo permitido
function isValidLength(text, min, max) {
    if (typeof text !== 'string') return false;
    const clean = text.trim();
    if (clean.length < min || clean.length > max) {
        return false;
    }
    return true;
}

// Revisa que sea un enlace http o https y que no pase del límite
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
        // Si new URL falla es que el texto no es un enlace
        return false;
    }
}

// Dice si el repositorio es de github, gitlab o bitbucket
// Si no es de ninguno o le falta usuario y repositorio regresa null
function getRepositoryPlatform(url) {
    if (!isValidHttpUrl(url, 255)) return null;

    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'https:') return null;

    const host = parsed.hostname.toLowerCase();
    // Quitamos las diagonales de las orillas para contar las partes de la ruta
    const cleanPath = parsed.pathname.replace(/^\/+|\/+$/g, '');
    const segments = cleanPath.split('/');

    // Debe tener al menos el usuario y el nombre del proyecto
    if (segments.length < 2 || !segments[0] || !segments[1]) {
        return null;
    }

    if (host === 'github.com' || host === 'www.github.com') return 'github';
    if (host === 'gitlab.com' || host === 'www.gitlab.com') return 'gitlab';
    if (host === 'bitbucket.org' || host === 'www.bitbucket.org') return 'bitbucket';

    return null;
}

// Los enlaces del perfil son opcionales, así que vacío o null es válido
// Si trae algo debe ser https y del dominio correcto
function isValidProfileLink(url, allowedDomains) {
    if (url === null || url === undefined || url === '') return true;
    if (!isValidHttpUrl(url, 255)) return false;

    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'https:') return false;

    // Sin lista de dominios, como en el sitio personal, basta con que sea https
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

// La calificación debe ser un entero del 1 al 5
function isValidScore(value) {
    if (value === null || value === undefined || value === '') return false;
    const number = Number(value);
    if (!Number.isInteger(number)) return false;
    if (number < 1 || number > 5) return false;
    return true;
}

// Entero mayor a 0, sirve para páginas y límites
function isValidPositiveInteger(value) {
    if (value === null || value === undefined || value === '') return false;
    const number = Number(value);
    if (!Number.isInteger(number) || number <= 0) {
        return false;
    }
    return true;
}

// Validamos los UUID antes de ir a la base de datos para evitar errores
function isValidUuid(text) {
    if (typeof text !== 'string') return false;
    const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return regex.test(text);
}

// La fecha debe venir como yyyy-MM-dd y existir en el calendario
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