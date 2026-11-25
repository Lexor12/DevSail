//Registra la aceptacion del aviso de privacidad y los terminos
const pool = require('../../config/db');

// document puede ser privacy_notice o terms
async function createLegalAcceptance(userId, document, version, db = pool) {
    await db.query(//Hay que aceptar ambos para usar la plataforma, lo guardamos por si hay auditorias
        `INSERT INTO legal_acceptances (user_id, document, version) VALUES ($1, $2, $3)`,
        [userId, document, version]
    );
}
//Exportamos la funcion para los controllers
module.exports = { createLegalAcceptance };