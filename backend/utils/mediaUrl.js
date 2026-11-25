const { env } = require('../config/env');

function buildMediaUrl(storagePath) {
    if (!storagePath) return null;
    // Si ya viene como URL completa, la devolvemos tal cual
    if (/^https?:\/\//i.test(storagePath)) {
        return storagePath;
    }
    const baseUrl = (env.supabase.mediaBaseUrl || '').replace(/\/+$/, '');
    const cleanPath = String(storagePath).replace(/^\/+/, '');

    // Sin la variable no hay forma de armar la direccion, el frontend muestra el recuadro vacio
    if (!baseUrl) {
        return null;
    }
    return `${baseUrl}/${cleanPath}`;
}

function attachMediaUrl(imageObj) {
    if (!imageObj) return imageObj;
    const rawPath = imageObj.storagePath ?? imageObj.storage_path ?? imageObj.path ?? null;
    return {
        ...imageObj,
        url: buildMediaUrl(rawPath)
    };
}

module.exports = {
    buildMediaUrl,
    attachMediaUrl
};