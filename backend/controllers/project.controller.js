// Este archivo controla todo el ciclo de vida de los proyectos: inicio, busqueda con filtros,
// detalle publico, creacion con imagenes, edicion, cambio de estado (publicado o desactivado) y borrado.
const pool = require('../config/db');
const projectRepo = require('../services/repositories/project.service');
const catalogRepo = require('../services/repositories/catalog.service');
const imageRepo = require('../services/repositories/projectImage.service');
const techRepo = require('../services/repositories/projectTechnology.service');
const savedRepo = require('../services/repositories/savedProject.service');
const ratingRepo = require('../services/repositories/rating.service');
const visitRepo = require('../services/repositories/visit.service');
const proRepo = require('../services/repositories/proSubscription.service');
const featuredRepo = require('../services/repositories/featured.service');
const storageService = require('../services/bucket/storage.service');
const { attachMediaUrl, buildMediaUrl } = require('../utils/mediaUrl');
const {
    isValidLength,
    isValidHttpUrl,
    getRepositoryPlatform,
    isValidUuid,
    isValidNickname,
    isValidPositiveInteger
} = require('../utils/validators');

const FREE_PROJECTS_LIMIT = 3;
const MAX_PROJECT_IMAGES = 4;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB por captura
const MIN_IMAGE_SIZE = { width: 400, height: 300 };

// Carga las 3 secciones de la pantalla de inicio: destacados, mejor calificados de la semana y recientes
async function getHomeProjects(req, res) {
    try {
        // La semana (7 días) es lo normal, pero el frontend puede pedir el mes con ?period=month
        const period = req.query.period === 'month' ? 30 : 7;
        // Las tres consultas son independientes, asi que las lanzamos al mismo tiempo
        /*const [featured, topRated, latest] = await Promise.all([
            projectRepo.getFeaturedProjects(12),
            projectRepo.getTopRatedProjects(period, 3, 8),
            projectRepo.getLatestProjects(12)
        ]);*/
        const featured = await projectRepo.getFeaturedProjects(12)
        const topRated = await projectRepo.getTopRatedProjects(period, 3, 8)
        const latest = await projectRepo.getLatestProjects(12)

        return res.status(200).json({
            featured,
            topRated,
            latest
        });
    } catch (error) {
        console.error('Error en getHomeProjects:', error);
        return res.status(500).json({ message: 'Error al cargar los proyectos del inicio.' });
    }
}

// Busca proyectos combinando texto, tipo, tecnologias, rango de calificacion, etiquetas y orden
async function searchProjects(req, res) {
    try {
        const text = typeof req.query.text === 'string' ? req.query.text.trim() : '';
        const typeCode = typeof req.query.typeCode === 'string' ? req.query.typeCode.trim() : '';

        // Las tecnologias pueden venir separadas por coma, por ejemplo ?technologies=uuid1,uuid2
        let technologyIds = [];
        if (typeof req.query.technologies === 'string' && req.query.technologies.trim() !== '') {
            const rawIds = req.query.technologies.split(',');
            for (let i = 0; i < rawIds.length; i++) {
                const cleanId = rawIds[i].trim();
                if (!isValidUuid(cleanId)) {
                    return res.status(400).json({ message: 'Uno de los IDs de tecnología no es válido.' });
                }
                technologyIds.push(cleanId);
            }
        }

        const minRating = req.query.minRating !== undefined ? Number(req.query.minRating) : 0;
        const maxRating = req.query.maxRating !== undefined ? Number(req.query.maxRating) : 5;
        if (isNaN(minRating) || isNaN(maxRating) || minRating < 0 || maxRating > 5 || minRating > maxRating) {
            return res.status(400).json({ message: 'El rango de calificación debe estar entre 0 y 5.' });
        }

        const page = isValidPositiveInteger(req.query.page) ? Number(req.query.page) : 1;
        // Solo se permiten 12, 24 o 48 resultados por página
        const requestedSize = Number(req.query.pageSize);
        const pageSize = [12, 24, 48].includes(requestedSize) ? requestedSize : 12;

        const result = await projectRepo.searchProjects({
            text,
            typeCode,
            technologyIds,
            minRating,
            maxRating,
            seekingFeedback: req.query.seekingFeedback === 'true',
            openToCollaborate: req.query.openToCollaborate === 'true',
            hasDemo: req.query.hasDemo === 'true',
            onlyFeatured: req.query.onlyFeatured === 'true',
            sortBy: req.query.sortBy || 'recent',
            page,
            pageSize
        });

        return res.status(200).json({
            projects: result.projects,
            total: result.total,
            page,
            pageSize
        });
    } catch (error) {
        console.error('Error en searchProjects:', error);
        return res.status(500).json({ message: 'Error al buscar proyectos.' });
    }
}

// Muestra la ficha completa de un proyecto y registra visita anonima si lo ve alguien que no es el dueño
async function getProjectDetail(req, res) {
    try {
        const projectId = req.params.id;
        if (!isValidUuid(projectId)) {
            return res.status(400).json({ message: 'El ID del proyecto no es válido.' });
        }

        const project = await projectRepo.getProjectDetailById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado.' });
        }

        const currentUserId = req.user ? req.user.id : null;
        const currentUserRole = req.user ? req.user.role : null;
        const isOwner = currentUserId === project.ownerId;
        const isAdmin = currentUserRole === 'admin';

        // Si el proyecto esta desactivado o oculto, solo su dueño o el administrador pueden verlo
        if (project.status !== 'published' && !isOwner && !isAdmin) {
            return res.status(404).json({ message: 'Este proyecto no está disponible.' });
        }

        // Cargamos sus imagenes y tecnologias
        const [images, technologies] = await Promise.all([
            imageRepo.getImagesByProject(projectId),
            techRepo.getTechnologiesByProject(projectId)
        ]);
        project.images = images.map(attachMediaUrl);
        project.technologies = technologies;

        // Si hay sesion iniciada, revisamos si ya lo guardo o si ya lo califico para pintar bien los botones
        let isSaved = false;
        let myRating = null;
        if (currentUserId && !isOwner) {
            [isSaved, myRating] = await Promise.all([
                savedRepo.isProjectSavedByUser(currentUserId, projectId),
                ratingRepo.getRatingByUserAndProject(currentUserId, projectId)
            ]);
        }

        // Sumamos una visita diaria solo cuando el proyecto esta publicado y quien entra no es su dueño
        if (project.status === 'published' && !isOwner) {
            await visitRepo.registerProjectVisit(projectId);
        }

        return res.status(200).json({
            project,
            isOwner,
            isSaved,
            myRating
        });
    } catch (error) {
        console.error('Error en getProjectDetail:', error);
        return res.status(500).json({ message: 'Error al obtener el detalle del proyecto.' });
    }
}

// Lista todos los proyectos (publicados, desactivados y ocultos) del desarrollador logueado
async function getMyProjects(req, res) {
    try {
        const [projects, isPro] = await Promise.all([
            projectRepo.getProjectsByOwner(req.user.id),
            proRepo.isUserPro(req.user.id)
        ]);

        let publishedCount = 0;
        for (let i = 0; i < projects.length; i++) {
            if (projects[i].status === 'published') {
                publishedCount++;
            }
        }

        return res.status(200).json({
            projects,
            isPro,
            publishedCount,
            freeLimit: FREE_PROJECTS_LIMIT
        });
    } catch (error) {
        console.error('Error en getMyProjects:', error);
        return res.status(500).json({ message: 'Error al cargar tus proyectos.' });
    }
}

// Publica un nuevo proyecto con al menos 1 imagen (maximo 4) y entre 1 y 5 tecnologias
async function createProject(req, res) {
    const client = await pool.connect();
    const uploadedPaths = []; // Guardamos aqui lo que se suba al bucket por si hay que hacer limpieza si falla la BD

    try {
        const {
            projectTypeId, title, nickname, description, repositoryUrl,
            demoUrl, seekingFeedback, openToCollaborate, authorshipDeclared,
            technologyIds, images
        } = req.body;

        // Revisamos limite de proyectos activos si la cuenta es gratuita
        const isPro = await proRepo.isUserPro(req.user.id);
        if (!isPro) {
            const currentPublished = await projectRepo.countPublishedProjectsByOwner(req.user.id);
            if (currentPublished >= FREE_PROJECTS_LIMIT) {
                return res.status(403).json({
                    message: 'Ya tienes 3 proyectos publicados en el plan gratuito. Desactiva uno o adquiere el Plan Pro para publicar más.'
                });
            }
        }

        // Validaciones de campos obligatorios y longitudes
        if (!isValidUuid(projectTypeId)) {
            return res.status(400).json({ message: 'Selecciona un tipo de proyecto válido.' });
        }
        if (!isValidLength(title, 5, 80)) {
            return res.status(400).json({ message: 'El título debe tener entre 5 y 80 caracteres.' });
        }
        if (!isValidNickname(nickname)) {
            return res.status(400).json({ message: 'El nombre corto debe tener de 3 a 20 caracteres: solo letras, números, espacios, guion y punto.' });
        }
        if (!isValidLength(description, 50, 2000)) {
            return res.status(400).json({ message: 'La descripción debe tener entre 50 y 2000 caracteres.' });
        }
        if (authorshipDeclared !== true) {
            return res.status(400).json({ message: 'Debes declarar que eres autor o colaborador autorizado del proyecto.' });
        }

        const platform = getRepositoryPlatform(repositoryUrl);
        if (!platform) {
            return res.status(400).json({
                message: 'La URL del repositorio debe ser de GitHub, GitLab o Bitbucket con usuario y nombre de repositorio.'
            });
        }

        const cleanDemoUrl = typeof demoUrl === 'string' && demoUrl.trim() !== '' ? demoUrl.trim() : null;
        if (cleanDemoUrl && !isValidHttpUrl(cleanDemoUrl, 255)) {
            return res.status(400).json({ message: 'La URL de demostración no es válida.' });
        }

        // Validamos tecnologias (arreglo de 1 a 5 UUIDs sin repetir)
        if (!Array.isArray(technologyIds) || technologyIds.length < 1 || technologyIds.length > 5) {
            return res.status(400).json({ message: 'Debes elegir entre 1 y 5 tecnologías.' });
        }
        const uniqueTechIds = [...new Set(technologyIds)];
        if (uniqueTechIds.length !== technologyIds.length) {
            return res.status(400).json({ message: 'No repitas la misma tecnología.' });
        }
        for (let i = 0; i < uniqueTechIds.length; i++) {
            if (!isValidUuid(uniqueTechIds[i])) {
                return res.status(400).json({ message: 'Uno de los IDs de tecnología no es válido.' });
            }
        }

        // Validamos las imagenes recibidas (entre 1 y 4 imagenes en base64)
        if (!Array.isArray(images) || images.length < 1 || images.length > MAX_PROJECT_IMAGES) {
            return res.status(400).json({ message: 'Debes subir entre 1 y 4 imágenes del proyecto.' });
        }

        const decodedImages = [];
        for (let i = 0; i < images.length; i++) {
            try {
                const decoded = storageService.decodeAndValidateImage(images[i], MAX_IMAGE_BYTES, MIN_IMAGE_SIZE);
                decodedImages.push(decoded);
            } catch (imgError) {
                return res.status(400).json({ message: `Imagen ${i + 1}: ${imgError.message}` });
            }
        }

        // Validamos en BD que exista el tipo, que existan todas las tecnologias y que el repositorio no este duplicado
        const projectType = await catalogRepo.getProjectTypeById(projectTypeId);
        if (!projectType) {
            return res.status(400).json({ message: 'El tipo de proyecto seleccionado no existe.' });
        }

        const existingTechCount = await catalogRepo.countExistingTechnologies(uniqueTechIds);
        if (existingTechCount !== uniqueTechIds.length) {
            return res.status(400).json({ message: 'Alguna de las tecnologías elegidas no existe en el catálogo.' });
        }

        const cleanRepoUrl = repositoryUrl.trim();
        const duplicateRepo = await projectRepo.getProjectByRepositoryUrl(cleanRepoUrl);
        if (duplicateRepo) {
            return res.status(409).json({ message: 'Ese repositorio ya fue publicado anteriormente en DevSail.' });
        }

        // Primero creamos la fila del proyecto para obtener su UUID y guardar sus fotos en su carpeta
        await client.query('BEGIN');

        const newProjectId = await projectRepo.createProject({
            ownerId: req.user.id,
            projectTypeId,
            title: title.trim(),
            nickname: nickname.trim(),
            description: description.trim(),
            repositoryUrl: cleanRepoUrl,
            repositoryPlatform: platform,
            demoUrl: cleanDemoUrl,
            seekingFeedback: Boolean(seekingFeedback),
            openToCollaborate: Boolean(openToCollaborate),
            authorshipDeclared: true
        }, client);

        await techRepo.setProjectTechnologies(newProjectId, uniqueTechIds, client);

        // Subimos cada imagen al bucket y registramos su posicion (1 = portada)
        for (let i = 0; i < decodedImages.length; i++) {
            const img = decodedImages[i];
            const path = await storageService.uploadImage(
                `projects/${newProjectId}`,
                img.buffer,
                img.extension,
                img.mimeType
            );
            uploadedPaths.push(path);
            await imageRepo.addProjectImage(newProjectId, path, i + 1, client);
        }

        await client.query('COMMIT');

        return res.status(201).json({
            message: 'Proyecto publicado correctamente.',
            projectId: newProjectId
        });
    } catch (error) {
        await client.query('ROLLBACK');
        // Si ya habiamos subido fotos al bucket antes del error, las borramos para no dejar archivos huerfanos
        if (uploadedPaths.length > 0) {
            await storageService.deleteImages(uploadedPaths);
        }
        console.error('Error en createProject:', error);
        return res.status(500).json({ message: 'Error al publicar el proyecto.' });
    } finally {
        client.release();
    }
}

// Edita los datos de un proyecto existente (solo el dueño puede hacerlo y solo si no esta oculto por moderacion)
async function updateProject(req, res) {
    const client = await pool.connect();
    try {
        const projectId = req.params.id;
        if (!isValidUuid(projectId)) {
            return res.status(400).json({ message: 'El ID del proyecto no es válido.' });
        }

        const project = await projectRepo.getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado.' });
        }
        if (project.ownerId !== req.user.id) {
            return res.status(403).json({ message: 'No tienes permiso para editar este proyecto.' });
        }
        if (project.status === 'hidden') {
            return res.status(403).json({ message: 'Este proyecto está oculto por moderación y no puede editarse.' });
        }

        const {
            projectTypeId, title, nickname, description, repositoryUrl,
            demoUrl, seekingFeedback, openToCollaborate, technologyIds
        } = req.body;

        if (!isValidUuid(projectTypeId)) {
            return res.status(400).json({ message: 'Selecciona un tipo de proyecto válido.' });
        }
        if (!isValidLength(title, 5, 80)) {
            return res.status(400).json({ message: 'El título debe tener entre 5 y 80 caracteres.' });
        }
        if (!isValidNickname(nickname)) {
            return res.status(400).json({ message: 'El nombre corto debe tener de 3 a 20 caracteres: solo letras, números, espacios, guion y punto.' });
        }
        if (!isValidLength(description, 50, 2000)) {
            return res.status(400).json({ message: 'La descripción debe tener entre 50 y 2000 caracteres.' });
        }

        const platform = getRepositoryPlatform(repositoryUrl);
        if (!platform) {
            return res.status(400).json({
                message: 'La URL del repositorio debe ser de GitHub, GitLab o Bitbucket con usuario y nombre de repositorio.'
            });
        }

        const cleanDemoUrl = typeof demoUrl === 'string' && demoUrl.trim() !== '' ? demoUrl.trim() : null;
        if (cleanDemoUrl && !isValidHttpUrl(cleanDemoUrl, 255)) {
            return res.status(400).json({ message: 'La URL de demostración no es válida.' });
        }

        if (!Array.isArray(technologyIds) || technologyIds.length < 1 || technologyIds.length > 5) {
            return res.status(400).json({ message: 'Debes elegir entre 1 y 5 tecnologías.' });
        }
        const uniqueTechIds = [...new Set(technologyIds)];
        if (uniqueTechIds.length !== technologyIds.length) {
            return res.status(400).json({ message: 'No repitas la misma tecnología.' });
        }

        const projectType = await catalogRepo.getProjectTypeById(projectTypeId);
        if (!projectType) {
            return res.status(400).json({ message: 'El tipo de proyecto no existe.' });
        }

        const existingTechCount = await catalogRepo.countExistingTechnologies(uniqueTechIds);
        if (existingTechCount !== uniqueTechIds.length) {
            return res.status(400).json({ message: 'Alguna de las tecnologías elegidas no existe.' });
        }

        const cleanRepoUrl = repositoryUrl.trim();
        const duplicateRepo = await projectRepo.getProjectByRepositoryUrl(cleanRepoUrl);
        if (duplicateRepo && duplicateRepo.id !== projectId) {
            return res.status(409).json({ message: 'Otro proyecto ya tiene registrado ese repositorio.' });
        }

        await client.query('BEGIN');

        await projectRepo.updateProject(projectId, {
            projectTypeId,
            title: title.trim(),
            nickname: nickname.trim(),
            description: description.trim(),
            repositoryUrl: cleanRepoUrl,
            repositoryPlatform: platform,
            demoUrl: cleanDemoUrl,
            seekingFeedback: Boolean(seekingFeedback),
            openToCollaborate: Boolean(openToCollaborate)
        }, client);

        await techRepo.setProjectTechnologies(projectId, uniqueTechIds, client);

        await client.query('COMMIT');

        return res.status(200).json({ message: 'Proyecto actualizado correctamente.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en updateProject:', error);
        return res.status(500).json({ message: 'Error al actualizar el proyecto.' });
    } finally {
        client.release();
    }
}

// Agrega una nueva imagen a un proyecto existente (si aun tiene menos de 5)
async function addProjectImage(req, res) {
    try {
        const projectId = req.params.id;
        const { image } = req.body;

        if (!isValidUuid(projectId)) {
            return res.status(400).json({ message: 'El ID del proyecto no es válido.' });
        }

        const project = await projectRepo.getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado.' });
        }
        if (project.ownerId !== req.user.id) {
            return res.status(403).json({ message: 'No tienes permiso para modificar este proyecto.' });
        }
        if (project.status === 'hidden') {
            return res.status(403).json({ message: 'Este proyecto está oculto por moderación.' });
        }

        const currentCount = await imageRepo.countImagesByProject(projectId);
        if (currentCount >= MAX_PROJECT_IMAGES) {
            return res.status(400).json({ message: 'Este proyecto ya tiene el máximo de 4 imágenes.' });
        }

        if (typeof image !== 'string' || !image.trim()) {
            return res.status(400).json({ message: 'Debes enviar una imagen válida.' });
        }

        let decoded;
        try {
            decoded = storageService.decodeAndValidateImage(image, MAX_IMAGE_BYTES, MIN_IMAGE_SIZE);
        } catch (imgError) {
            return res.status(400).json({ message: imgError.message });
        }

        const storagePath = await storageService.uploadImage(
            `projects/${projectId}`,
            decoded.buffer,
            decoded.extension,
            decoded.mimeType
        );

        const newImageId = await imageRepo.addProjectImage(projectId, storagePath, currentCount + 1);

        return res.status(201).json({
            message: 'Imagen agregada correctamente.',
            image: {
                id: newImageId,
                storagePath,
                url: buildMediaUrl(storagePath),
                position: currentCount + 1
            }
        });
    } catch (error) {
        console.error('Error en addProjectImage:', error);
        return res.status(500).json({ message: 'Error al subir la imagen.' });
    }
}

// Reordena las imagenes del proyecto (la posicion 1 pasa a ser la portada)
async function reorderProjectImages(req, res) {
    const client = await pool.connect();
    try {
        const projectId = req.params.id;
        const { imageIds } = req.body;

        if (!isValidUuid(projectId)) {
            return res.status(400).json({ message: 'El ID del proyecto no es válido.' });
        }
        if (!Array.isArray(imageIds) || imageIds.length === 0) {
            return res.status(400).json({ message: 'Envía el orden de los IDs de las imágenes.' });
        }

        const project = await projectRepo.getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado.' });
        }
        if (project.ownerId !== req.user.id) {
            return res.status(403).json({ message: 'No tienes permiso para modificar este proyecto.' });
        }

        const currentImages = await imageRepo.getImagesByProject(projectId);
        if (currentImages.length !== imageIds.length) {
            return res.status(400).json({ message: 'La lista de imágenes no coincide con las del proyecto.' });
        }

        // Revisamos que todos los IDs enviados pertenezcan realmente a este proyecto
        const validIds = new Set(currentImages.map(img => img.id));
        for (let i = 0; i < imageIds.length; i++) {
            if (!validIds.has(imageIds[i])) {
                return res.status(400).json({ message: 'Uno de los IDs de imagen no pertenece a este proyecto.' });
            }
        }

        await client.query('BEGIN');
        for (let i = 0; i < imageIds.length; i++) {
            await imageRepo.updateImagePosition(imageIds[i], i + 1, client);
        }
        await client.query('COMMIT');

        return res.status(200).json({ message: 'Orden de imágenes actualizado.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en reorderProjectImages:', error);
        return res.status(500).json({ message: 'Error al reordenar las imágenes.' });
    } finally {
        client.release();
    }
}

// Elimina una imagen del proyecto (siempre debe quedar al menos 1)
async function deleteProjectImage(req, res) {
    const client = await pool.connect();
    try {
        const { id: projectId, imageId } = req.params;
        if (!isValidUuid(projectId) || !isValidUuid(imageId)) {
            return res.status(400).json({ message: 'ID inválido.' });
        }

        const project = await projectRepo.getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado.' });
        }
        if (project.ownerId !== req.user.id) {
            return res.status(403).json({ message: 'No tienes permiso para modificar este proyecto.' });
        }

        const images = await imageRepo.getImagesByProject(projectId);
        if (images.length <= 1) {
            return res.status(400).json({ message: 'El proyecto debe conservar al menos una imagen.' });
        }

        const targetImage = images.find(img => img.id === imageId);
        if (!targetImage) {
            return res.status(404).json({ message: 'Imagen no encontrada en este proyecto.' });
        }

        await client.query('BEGIN');
        await imageRepo.deleteImage(imageId, client);

        // Reacomodamos las posiciones restantes para que queden 1, 2, 3... sin huecos
        const remaining = images.filter(img => img.id !== imageId);
        for (let i = 0; i < remaining.length; i++) {
            await imageRepo.updateImagePosition(remaining[i].id, i + 1, client);
        }
        await client.query('COMMIT');

        await storageService.deleteImages(targetImage.storagePath);

        return res.status(200).json({ message: 'Imagen eliminada.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en deleteProjectImage:', error);
        return res.status(500).json({ message: 'Error al eliminar la imagen.' });
    } finally {
        client.release();
    }
}

// Activa o desactiva un proyecto del dueño (si tiene destacado activo no se puede desactivar)
async function toggleProjectStatus(req, res) {
    try {
        const projectId = req.params.id;
        const { status } = req.body; // 'published' o 'deactivated'

        if (!isValidUuid(projectId)) {
            return res.status(400).json({ message: 'El ID del proyecto no es válido.' });
        }
        if (status !== 'published' && status !== 'deactivated') {
            return res.status(400).json({ message: 'El estado solo puede ser published o deactivated.' });
        }

        const project = await projectRepo.getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado.' });
        }
        if (project.ownerId !== req.user.id) {
            return res.status(403).json({ message: 'No tienes permiso sobre este proyecto.' });
        }
        if (project.status === 'hidden') {
            return res.status(403).json({ message: 'Este proyecto fue ocultado por moderación y no puedes reactivarlo.' });
        }
        if (project.status === status) {
            return res.status(200).json({ message: 'El proyecto ya tiene ese estado.' });
        }

        // Si lo quiere desactivar, revisamos que no tenga un destacado vigente
        if (status === 'deactivated') {
            const isFeatured = await featuredRepo.isProjectFeatured(projectId);
            if (isFeatured) {
                return res.status(400).json({
                    message: 'No puedes desactivar un proyecto mientras tenga un destacado activo.'
                });
            }
        }

        // Si lo quiere reactivar, revisamos que no pase el limite de 3 proyectos del plan gratuito
        if (status === 'published') {
            const isPro = await proRepo.isUserPro(req.user.id);
            if (!isPro) {
                const currentPublished = await projectRepo.countPublishedProjectsByOwner(req.user.id);
                if (currentPublished >= FREE_PROJECTS_LIMIT) {
                    return res.status(403).json({
                        message: 'Ya tienes 3 proyectos publicados. Desactiva otro o contrata el Plan Pro para reactivar este.'
                    });
                }
            }
        }

        await projectRepo.setProjectStatus(projectId, status);

        return res.status(200).json({
            message: status === 'published' ? 'Proyecto reactivado.' : 'Proyecto desactivado.'
        });
    } catch (error) {
        console.error('Error en toggleProjectStatus:', error);
        return res.status(500).json({ message: 'Error al cambiar el estado del proyecto.' });
    }
}

// Elimina definitivamente un proyecto y borra sus imagenes de Storage
async function deleteProject(req, res) {
    try {
        const projectId = req.params.id;
        if (!isValidUuid(projectId)) {
            return res.status(400).json({ message: 'El ID del proyecto no es válido.' });
        }

        const project = await projectRepo.getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado.' });
        }
        if (project.ownerId !== req.user.id) {
            return res.status(403).json({ message: 'No tienes permiso para eliminar este proyecto.' });
        }

        // No permitimos borrar si tiene destacado vigente para evitar que pierda su pago por accidente
        const isFeatured = await featuredRepo.isProjectFeatured(projectId);
        if (isFeatured) {
            return res.status(400).json({ message: 'No puedes eliminar un proyecto mientras esté destacado.' });
        }

        const images = await imageRepo.getImagesByProject(projectId);
        const pathsToDelete = images.map(img => img.storagePath);

        await projectRepo.deleteProject(projectId);
        await storageService.deleteImages(pathsToDelete);

        return res.status(200).json({ message: 'Proyecto eliminado definitivamente.' });
    } catch (error) {
        console.error('Error en deleteProject:', error);
        return res.status(500).json({ message: 'Error al eliminar el proyecto.' });
    }
}

module.exports = {
    getHomeProjects,
    searchProjects,
    getProjectDetail,
    getMyProjects,
    createProject,
    updateProject,
    addProjectImage,
    reorderProjectImages,
    deleteProjectImage,
    toggleProjectStatus,
    deleteProject
};