// Subida y borrado de imagenes en Supabase Storage (avatares y capturas de proyectos)
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { env } = require('../../config/env');
const sizeOf = require('image-size');

const supabase = createClient(env.supabase.url, env.supabase.serviceKey);

// Decodifica un DataURL base64 y valida firma binaria real (magic bytes) para evitar archivos disfrazados
function decodeAndValidateImage(dataUrlBase64, maxBytes,minSize = null) {
    if (!dataUrlBase64 || typeof dataUrlBase64 !== 'string' || !dataUrlBase64.startsWith('data:')) {
        throw new Error('La imagen no tiene el formato esperado.');
    }
    const parts = dataUrlBase64.split(',');
    if (parts.length !== 2 || !parts[1]) {
        throw new Error('La imagen no tiene el formato esperado.');
    }

    const buffer = Buffer.from(parts[1], 'base64');
    if (buffer.length === 0 || buffer.length > maxBytes) {
        const maxMb = Math.round(maxBytes / (1024 * 1024));
        throw new Error(`La imagen no debe superar los ${maxMb} MB.`);
    }

    // Revisamos los primeros bytes reales del archivo
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebp = buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';

    let extension = null;
    let mimeType = null;

    if (isJpeg) {
        extension = 'jpg';
        mimeType = 'image/jpeg';
    } else if (isPng) {
        extension = 'png';
        mimeType = 'image/png';
    } else if (isWebp) {
        extension = 'webp';
        mimeType = 'image/webp';
    } else {
        throw new Error('Formato de imagen no válido. Solo se aceptan JPG, PNG o WEBP.');
    }

    // Si nos piden un tamaño mínimo (capturas de proyectos), lo revisamos con las medidas reales
    if (minSize) {
        let dimensions;
        try {
            dimensions = sizeOf(buffer);
        } catch (error) {
            throw new Error('No se pudo leer el tamaño de la imagen.');
        }
        if (dimensions.width < minSize.width || dimensions.height < minSize.height) {
            throw new Error(`La imagen debe medir al menos ${minSize.width} × ${minSize.height} px.`);
        }
    }

    return { buffer, extension, mimeType };
}

// Sube una imagen a una carpeta ('avatars' o 'projects/<projectId>') con nombre UUID aleatorio
async function uploadImage(folder, buffer, extension, mimeType) {
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const storagePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage.from(env.supabase.bucket)
    .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

    if (error) {
        console.error('Error subiendo a Supabase Storage:', error.message);
        throw new Error('El almacenamiento de imágenes no está disponible en este momento.');
    }
    return storagePath;
}

// Elimina uno o varios archivos del bucket (ignora rutas nulas o vacias)
async function deleteImages(storagePaths) {
    const validPaths = (Array.isArray(storagePaths) ? storagePaths : [storagePaths]).filter(Boolean);
    if (validPaths.length === 0) return;

    const { error } = await supabase.storage
        .from(env.supabase.bucket)
        .remove(validPaths);

    if (error) {
        console.error('Error borrando en Supabase Storage:', error.message);
    }
}
// Exportamos las funciones para que puedan ser usadas en otros archivos
module.exports = { decodeAndValidateImage, uploadImage, deleteImages };