//Reporte de un proyecto o comentario con los campos de la tabla reports
class Report {
    constructor(
        id, targetType, projectId, ratingId, status, reportsCount,
        resolutionNote, resolvedBy, resolvedAt, createdAt, updatedAt
    ) {
        this.id = id;
        this.targetType = targetType; // project o comment
        this.projectId = projectId;
        this.ratingId = ratingId;
        this.status = status; // pending, resolved_hidden o dismissed
        this.reportsCount = reportsCount;
        this.resolutionNote = resolutionNote;
        this.resolvedBy = resolvedBy;
        this.resolvedAt = resolvedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

// Fila de la tabla de reportes del administrador con un resumen y el ultimo reporte
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

// Quien reporto y por que, solo lo ve el admin
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