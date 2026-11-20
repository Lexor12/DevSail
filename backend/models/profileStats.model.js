// Esta clase representa las estaditicas publicas calculadas del perfil de un desarrollador
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
        this.bestProject = bestProject; // { id, title, nickname, avgOverall } o null
        this.topTechnologies = topTechnologies; // arreglo de hasta 5 nombres
    }
}
module.exports = { ProfileStats };