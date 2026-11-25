// Tarjeta resumida de un proyecto, igual que ProjectCard del backend
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

// Respuesta del inicio
export interface HomeProjects {
    featured: ProjectSummary[];
    topRated: ProjectSummary[];
    latest: ProjectSummary[];
}

// Respuesta de la búsqueda
export interface SearchResult {
    projects: ProjectSummary[];
    total: number;
    page: number;
    pageSize: number;
}

// Filtros de búsqueda como se leen de la dirección
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