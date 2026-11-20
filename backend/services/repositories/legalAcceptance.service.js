//Este archivo, contiene la función que permite el registro de aceptacion de aviso de privacidad y terminos
const pool = require('../../config/db');

// document, recibe uno de los 2 siguientes valores: 'privacy_notice' | 'terms'
async function createLegalAcceptance(userId, document, version, db = pool) {
    await db.query(//Cuando ambos documentos son aceptados, entonces se puede usar la plataforma, y si no, entonces no se puede usar la plataforma, guardamos el registro en caso de auditorias
        `INSERT INTO legal_acceptances (user_id, document, version) VALUES ($1, $2, $3)`,
        [userId, document, version]
    );
}
//Para poder usar la función por los controllers, debemos exportarla
module.exports = { createLegalAcceptance };