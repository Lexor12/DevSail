const { buildMediaUrl } = require('../utils/mediaUrl');

//Calificacion de un proyecto con los campos de la tabla ratings
class Rating {
    constructor(
        id, projectId, userId, scoreDesign, scoreUsefulness, scoreCodeQuality,
        scoreDocumentation, scoreInnovation, average, comment, isEdited,
        commentHidden, commentHiddenReason, commentHiddenAt, commentHiddenBy,
        createdAt, updatedAt
    ) {
        this.id = id;
        this.projectId = projectId;
        this.userId = userId;
        this.scoreDesign = scoreDesign;
        this.scoreUsefulness = scoreUsefulness;
        this.scoreCodeQuality = scoreCodeQuality;
        this.scoreDocumentation = scoreDocumentation;
        this.scoreInnovation = scoreInnovation;
        this.average = average;
        this.comment = comment;
        this.isEdited = isEdited;
        this.commentHidden = commentHidden;
        this.commentHiddenReason = commentHiddenReason;
        this.commentHiddenAt = commentHiddenAt;
        this.commentHiddenBy = commentHiddenBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

//Calificacion con los datos del autor para el detalle del proyecto
class ProjectCommentItem {
    constructor(
        id, userId, authorUsername, authorFullName, authorAvatarPath,
        scoreDesign, scoreUsefulness, scoreCodeQuality, scoreDocumentation,
        scoreInnovation, average, comment, isEdited, commentHidden, createdAt
    ) {
        this.id = id;
        this.userId = userId;
        this.authorUsername = authorUsername;
        this.authorFullName = authorFullName;
        this.authorAvatarPath = authorAvatarPath;
        this.authorAvatarUrl = buildMediaUrl(authorAvatarPath);
        this.scoreDesign = scoreDesign;
        this.scoreUsefulness = scoreUsefulness;
        this.scoreCodeQuality = scoreCodeQuality;
        this.scoreDocumentation = scoreDocumentation;
        this.scoreInnovation = scoreInnovation;
        this.average = average;
        this.comment = comment;
        this.isEdited = isEdited;
        this.commentHidden = commentHidden;
        this.createdAt = createdAt;
    }
}

module.exports = { Rating, ProjectCommentItem };