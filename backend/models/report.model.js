//Esta clase representa un reporte de la base de datos, que equivale a un proyecto o comentario, con todos los campos de la tabla reports
class Report {
    constructor(
        id, targetType, projectId, ratingId, status, reportsCount,
        resolutionNote, resolvedBy, resolvedAt, createdAt, updatedAt
    ) {
        this.id = id;
        this.targetType = targetType; // 'project' | 'comment'
        this.projectId = projectId;
        this.ratingId = ratingId;
        this.status = status; // 'pending' | 'resolved_hidden' | 'dismissed'
        this.reportsCount = reportsCount;
        this.resolutionNote = resolutionNote;
        this.resolvedBy = resolvedBy;
        this.resolvedAt = resolvedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

// Esta es una clase que representa una tabla del frontend para la sección de reportes para el panel del administrador, que contiene un resumen de la informacion del reporte y del ultimo reporte que se hizo
class ReportListItem {
    constructor(
        id, targetType, targetId, contentSummary, lastReasonName,
        lastReporterUsername, reportsCount, status, createdAt, updatedAt
    ) {
        this.id = id;
        this.targetType = targetType;
        this.targetId = targetId;
        this.contentSummary = contentSummary;
        this.lastReasonName = lastReasonName;
        this.lastReporterUsername = lastReporterUsername;
        this.reportsCount = reportsCount;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

// Detalle individual de quien reporto y por que (solo lo ve el admin)
class ReportEntry {
    constructor(id, reportId, reporterId, reporterUsername, reasonId, reasonName, detail, createdAt) {
        this.id = id;
        this.reportId = reportId;
        this.reporterId = reporterId;
        this.reporterUsername = reporterUsername;
        this.reasonId = reasonId;
        this.reasonName = reasonName;
        this.detail = detail;
        this.createdAt = createdAt;
    }
}

module.exports = { Report, ReportListItem, ReportEntry };