export interface ProjectType {
    id: string;
    code: string;
    name: string;
    sortOrder: number;
}

export interface Technology {
    id: string;
    name: string;
}

// Respuesta del catálogo de proyectos
export interface ProjectCatalogs {
    projectTypes: ProjectType[];
    technologies: Technology[];
}