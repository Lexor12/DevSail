// Esta es la clase que se utiliza para representar un proyecto en la base de datos, y se usa en el backend para manejar la informacion de los proyectos, como crear, editar, eliminar, etc.
class Project {
    constructor(
        id, ownerId, projectTypeId, title, nickname, description, repositoryUrl,
        repositoryPlatform, demoUrl, seekingFeedback, openToCollaborate,
        authorshipDeclared, status, hiddenReason, hiddenAt, hiddenBy,
        deactivatedAt, avgDesign, avgUsefulness, avgCodeQuality,
        avgDocumentation, avgInnovation, avgOverall, ratingsCount,
        savesCount, publishedAt, updatedAt
    ) {
        this.id = id;
        this.ownerId = ownerId;
        this.projectTypeId = projectTypeId;
        this.title = title;
        this.nickname = nickname;
        this.description = description;
        this.repositoryUrl = repositoryUrl;
        this.repositoryPlatform = repositoryPlatform;
        this.demoUrl = demoUrl;
        this.seekingFeedback = seekingFeedback;
        this.openToCollaborate = openToCollaborate;
        this.authorshipDeclared = authorshipDeclared;
        this.status = status; // 'published' | 'deactivated' | 'hidden'
        this.hiddenReason = hiddenReason;
        this.hiddenAt = hiddenAt;
        this.hiddenBy = hiddenBy;
        this.deactivatedAt = deactivatedAt;
        this.avgDesign = avgDesign;
        this.avgUsefulness = avgUsefulness;
        this.avgCodeQuality = avgCodeQuality;
        this.avgDocumentation = avgDocumentation;
        this.avgInnovation = avgInnovation;
        this.avgOverall = avgOverall;
        this.ratingsCount = ratingsCount;
        this.savesCount = savesCount;
        this.publishedAt = publishedAt;
        this.updatedAt = updatedAt;
    }
}

// Esta clase a diferencia de la de arriba, sirve para representar una tarjeta resumida de un proyecto para el inicio, busqueda, portafolio y lista de guardados en el Frontend
class ProjectCard {
    constructor(
        id, title, nickname, typeCode, typeName, coverPath, avgOverall,
        ratingsCount, seekingFeedback, openToCollaborate, isFeatured,
        technologies, savesCount, publishedAt
    ) {
        this.id = id;
        this.title = title;
        this.nickname = nickname;
        this.typeCode = typeCode;
        this.typeName = typeName;
        this.coverPath = coverPath;
        this.avgOverall = avgOverall;
        this.ratingsCount = ratingsCount;
        this.seekingFeedback = seekingFeedback;
        this.openToCollaborate = openToCollaborate;
        this.isFeatured = isFeatured;
        this.technologies = technologies; // arreglo de strings
        this.savesCount = savesCount;
        this.publishedAt = publishedAt;
    }
}

// Esta clase representa la vista completa de un proyecto para el detalle del proyecto, incluyendo la informacion del propietario, imagenes y tecnologias
class ProjectDetail {
    constructor(
        id, ownerId, ownerUsername, ownerFullName, ownerAvatarPath,
        projectTypeId, typeCode, typeName, title, nickname, description,
        repositoryUrl, repositoryPlatform, demoUrl, status, hiddenReason,
        seekingFeedback, openToCollaborate, avgDesign, avgUsefulness,
        avgCodeQuality, avgDocumentation, avgInnovation, avgOverall,
        ratingsCount, savesCount, isFeatured, publishedAt, images = [], technologies = []
    ) {
        this.id = id;
        this.ownerId = ownerId;
        this.ownerUsername = ownerUsername;
        this.ownerFullName = ownerFullName;
        this.ownerAvatarPath = ownerAvatarPath;
        this.projectTypeId = projectTypeId;
        this.typeCode = typeCode;
        this.typeName = typeName;
        this.title = title;
        this.nickname = nickname;
        this.description = description;
        this.repositoryUrl = repositoryUrl;
        this.repositoryPlatform = repositoryPlatform;
        this.demoUrl = demoUrl;
        this.status = status;
        this.hiddenReason = hiddenReason;
        this.seekingFeedback = seekingFeedback;
        this.openToCollaborate = openToCollaborate;
        this.avgDesign = avgDesign;
        this.avgUsefulness = avgUsefulness;
        this.avgCodeQuality = avgCodeQuality;
        this.avgDocumentation = avgDocumentation;
        this.avgInnovation = avgInnovation;
        this.avgOverall = avgOverall;
        this.ratingsCount = ratingsCount;
        this.savesCount = savesCount;
        this.isFeatured = isFeatured;
        this.publishedAt = publishedAt;
        this.images = images;
        this.technologies = technologies;
    }
}

//Esta clase representa una fila en la tabla "Mis proyectos" del desarrollador
class OwnerProject {
    constructor(
        id, title, nickname, status, hiddenReason, coverPath, avgOverall,
        ratingsCount, savesCount, totalVisits, featuredEndsAt, publishedAt
    ) {
        this.id = id;
        this.title = title;
        this.nickname = nickname;
        this.status = status;
        this.hiddenReason = hiddenReason;
        this.coverPath = coverPath;
        this.avgOverall = avgOverall;
        this.ratingsCount = ratingsCount;
        this.savesCount = savesCount;
        this.totalVisits = totalVisits;
        this.featuredEndsAt = featuredEndsAt; // null si no tiene destacado vigente
        this.publishedAt = publishedAt;
    }
}

module.exports = { Project, ProjectCard, ProjectDetail, OwnerProject };