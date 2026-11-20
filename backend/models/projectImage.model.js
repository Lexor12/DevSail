// Imagen almacenada en Supabase Storage asociada a un proyecto 
class ProjectImage {
    constructor(id, projectId, storagePath, position, createdAt) {
        this.id = id;
        this.projectId = projectId;
        this.storagePath = storagePath;
        this.position = position;//Si la posicion es 1, significa que es la imagen de portada del proyecto. Si es 2 o mayor, significa que es una imagen adicional del proyecto.
        this.createdAt = createdAt;
    }
}
module.exports = { ProjectImage };