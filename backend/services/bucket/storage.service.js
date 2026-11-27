// Subida y borrado de avatares y capturas en Supabase Storage
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { env } = require('../../config/env');
const { imageSize } = require('image-size');//Version 2: corrige fallas que podian congelar el servidor

const supabase = createClient(env.supabase.url, env.supabase.serviceKey);

// Decodifica la imagen en base64 y revisa sus primeros bytes para evitar archivos disfrazados
function decodeAndValidateImage(dataUrlBase64, maxBytes,minSize = null) {
    if (!dataUrlBase64 || typeof dataUrlBase64 !== 'string' || !dataUrlBase64.startsWith('data:')) {
        throw new Error('La imagen no tiene el formato esperado.');
    }

    //Partimos el texto para separar el encabezado data del contenido
    const parts = dataUrlBase64.split(',');
    if (parts.length !== 2 || !parts[1]) {
        throw new Error('La imagen no tiene el formato esperado.');
    }
    //Si hay base64 lo convertimos a bytes
    const buffer = Buffer.from(parts[1], 'base64');
    if (buffer.length === 0 || buffer.length > maxBytes) {//Revisamos que no pese mas del limite
        const maxMb = Math.round(maxBytes / (1024 * 1024));
        throw new Error(`La imagen no debe superar los ${maxMb} MB.`);
    }

    //Los primeros bytes indican el tipo de archivo, revisamos que sea un formato valido
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

    // Si piden un tamaño minimo, como en las capturas, revisamos las medidas reales
    if (minSize) {
        let dimensions;
        try {
            dimensions = imageSize(buffer);
        } catch (error) {
            throw new Error('No se pudo leer el tamaño de la imagen.');
        }
        //Checamos las medidas de la imagen
        if (dimensions.width < minSize.width || dimensions.height < minSize.height) {
            throw new Error(`La imagen debe medir al menos ${minSize.width} × ${minSize.height} px.`);
        }
    }
    return { buffer, extension, mimeType };
}

// Sube la imagen a la carpeta avatars o a la del proyecto con un nombre aleatorio
async function uploadImage(folder, buffer, extension, mimeType) {
    const fileName = `${crypto.randomUUID()}.${extension}`;//A mi me gusta usar un UUID aleatorio, para que cuando cambiemos la foto de perfil no marque error
    const storagePath = `${folder}/${fileName}`;//cada carpeta de proyecto lleva su UUID

    const { error } = await supabase.storage.from(env.supabase.bucket)
    .upload(storagePath, buffer, { contentType: mimeType, upsert: false });
    //Para usar el bucket lo mas facil es la libreria de Supabase
    //le pasamos la ruta, el contenido y el tipo de archivo

    if (error) {
        console.error('Error subiendo a Supabase Storage:', error.message);
        throw new Error('El almacenamiento de imágenes no está disponible en este momento.');
    }
    return storagePath;
}

// Borra uno o varios archivos e ignora las rutas vacias
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
module.exports = { decodeAndValidateImage, uploadImage, deleteImages };