// Tarjeta resumida de un proyecto (igual que la clase ProjectCard del backend)
export interface ProjectSummary {
    id: string;
    title: string;
    nickname: string;
    typeCode: string;
    typeName: string;
    coverPath: string | null;
    avgOverall: number | string | null;
    ratingsCount: number;
    seekingFeedback: boolean;
    openToCollaborate: boolean;
    isFeatured: boolean;
    technologies: string[];
    savesCount: number;
    publishedAt: string;
}

// Respuesta de GET /api/projects/home
export interface HomeProjects {
    featured: ProjectSummary[];
    topRated: ProjectSummary[];
    latest: ProjectSummary[];
}

// Respuesta de GET /api/projects/search
export interface SearchResult {
    projects: ProjectSummary[];
    total: number;
    page: number;
    pageSize: number;
}

// Filtros de búsqueda tal como se leen de la dirección (/explore?q=...&type=...)
export interface SearchFilters {
    q: string;
    type: string;
    technologies: string[];
    minRating: number;
    maxRating: number;
    feedback: boolean;
    collaborate: boolean;
    demo: boolean;
    featured: boolean;
    sort: string;
    page: number;
    pageSize: number;
}