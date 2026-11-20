// Catalogo cerrado de tipos de proyecto para las 7 opciones que son:
/*
1. Aplicación web
2. Aplicación móvil o de escritorio
3. Librería
4. API o servicio
5. Herramienta o script
6. Videojuego
7. Otro
*/
class ProjectType {
    constructor(id, code, name, sortOrder) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.sortOrder = sortOrder;
    }
}

// Catalogo cerrado de tecnologias
class Technology {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

// Catalogo cerrado de motivos de reporte
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