// Catalogo de los 7 tipos de proyecto que son
/* Aplicación web, aplicación móvil o de escritorio, librería, API o servicio, herramienta o script, videojuego y otro */
class ProjectType {
    constructor(id, code, name, sortOrder) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.sortOrder = sortOrder;
    }
}

// Catalogo de tecnologias
class Technology {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

// Catalogo de motivos de reporte
class ReportReason {
    constructor(id, code, name, requiresDetail, sortOrder) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.requiresDetail = requiresDetail;
        this.sortOrder = sortOrder;
    }
}

module.exports = { ProjectType, Technology, ReportReason };