// Esta clase representa del frontend del administrador los valores de Las 6 tarjetas del resumen del panel
class DashboardSummary {
    constructor(pendingReports, hiddenProjects, hiddenComments, activeFeatured, activeProPlans, monthIncome) {
        this.pendingReports = pendingReports;
        this.hiddenProjects = hiddenProjects;
        this.hiddenComments = hiddenComments;
        this.activeFeatured = activeFeatured;
        this.activeProPlans = activeProPlans;
        this.monthIncome = monthIncome;
    }
}

// Esta clase representa una Fila de la tabla de proyectos del administrador
class AdminProject {
    constructor(
        id, title, nickname, ownerUsername, status, hiddenReason,
        avgOverall, ratingsCount, pendingReports, publishedAt
    ) {
        this.id = id;
        this.title = title;
        this.nickname = nickname;
        this.ownerUsername = ownerUsername;
        this.status = status;
        this.hiddenReason = hiddenReason;
        this.avgOverall = avgOverall;
        this.ratingsCount = ratingsCount;
        this.pendingReports = pendingReports;
        this.publishedAt = publishedAt;
    }
}

// Esta clase representa una Fila de la tabla de comentarios del administrador
class AdminComment {
    constructor(id, projectId, projectNickname, authorUsername, comment, commentHidden, hiddenReason, createdAt) {
        this.id = id;
        this.projectId = projectId;
        this.projectNickname = projectNickname;
        this.authorUsername = authorUsername;
        this.comment = comment;
        this.commentHidden = commentHidden;
        this.hiddenReason = hiddenReason;
        this.createdAt = createdAt;
    }
}

module.exports = { DashboardSummary, AdminProject, AdminComment };