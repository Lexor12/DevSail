// Escapa los comodines de LIKE para que se busquen como texto normal
function escapeLike(text) {
    return text.replace(/[\\%_]/g, '\\$&');
}

module.exports = { escapeLike };
