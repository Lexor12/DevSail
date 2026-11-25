// Estadisticas publicas del perfil de un usuario
class ProfileStats {
    constructor(
        publishedProjects, avgRating, ratingsReceived, savesReceived,
        ratingsGiven, bestProject, topTechnologies
    ) {
        this.publishedProjects = publishedProjects;
        this.avgRating = avgRating;
        this.ratingsReceived = ratingsReceived;
        this.savesReceived = savesReceived;
        this.ratingsGiven = ratingsGiven;
        this.bestProject = bestProject; // el proyecto mejor calificado o null
        this.topTechnologies = topTechnologies; // hasta 5 nombres
    }
}
module.exports = { ProfileStats };