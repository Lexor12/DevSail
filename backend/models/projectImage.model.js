// Imagen de un proyecto guardada en Supabase Storage
class ProjectImage {
    constructor(id, projectId, storagePath, position, createdAt) {
        this.id = id;
        this.projectId = projectId;
        this.storagePath = storagePath;
        this.position = position;//La posicion 1 es la portada y las demas son imagenes adicionales
        this.createdAt = createdAt;
    }
}
module.exports = { ProjectImage };