// Entrega los catalogos de tipos de proyecto, tecnologias
// y motivos de reporte para los selectores del frontend
const catalogRepo = require('../services/repositories/catalog.service');

// Devuelve los tipos de proyecto y las tecnologias en una sola llamada
async function getProjectCatalogs(req, res) {
    try {
        //Primero obtenemos los tipos de proyecto
        const projectTypes = await catalogRepo.getAllProjectTypes();
        //Despues las tecnologias disponibles
        const technologies = await catalogRepo.getAllTechnologies();

        return res.status(200).json({
            projectTypes,
            technologies
        });
    } catch (error) {
        console.error('Error en getProjectCatalogs:', error);
        return res.status(500).json({ message: 'Error al cargar los catálogos.' });
    }
}

// Devuelve los motivos de reporte ordenados
async function getReportReasons(req, res) {
    try {
        const reasons = await catalogRepo.getAllReportReasons();
        return res.status(200).json({ reasons });
    } catch (error) {
        console.error('Error en getReportReasons:', error);
        return res.status(500).json({ message: 'Error al cargar los motivos de reporte.' });
    }
}

module.exports = { getProjectCatalogs, getReportReasons };