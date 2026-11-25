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

// Respuesta de GET /api/catalogs/projects
export interface ProjectCatalogs {
    projectTypes: ProjectType[];
    technologies: Technology[];
}