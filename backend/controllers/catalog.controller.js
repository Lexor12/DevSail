// Este archivo entrega los catalogos cerrados de la plataforma: tipos de proyecto,
// tecnologias disponibles y motivos de reporte para llenar los selectores del frontend.
const catalogRepo = require('../services/repositories/catalog.service');

// Devuelve los 7 tipos de proyecto y todas las tecnologias en una sola llamada
async function getProjectCatalogs(req, res) {
    try {
        const [projectTypes, technologies] = await Promise.all([
            catalogRepo.getAllProjectTypes(),
            catalogRepo.getAllTechnologies()
        ]);

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