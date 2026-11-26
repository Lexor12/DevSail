// Datos de las pantallas de moderación del administrador

// Fila de la tabla de proyectos
export interface AdminProject {
  id: string;
  title: string;
  nickname: string;
  ownerUsername: string;
  status: 'published' | 'deactivated' | 'hidden';
  hiddenReason: string | null;
  avgOverall: number | null;
  ratingsCount: number;
  pendingReports: number;
  publishedAt: string;
}

export interface AdminProjectList {
  projects: AdminProject[];
  total: number;
  page: number;
  pageSize: number;
}

// Fila de la tabla de comentarios
export interface AdminComment {
  id: string;
  projectId: string;
  projectNickname: string;
  authorUsername: string;
  comment: string;
  commentHidden: boolean;
  hiddenReason: string | null;
  createdAt: string;
}

export interface AdminCommentList {
  comments: AdminComment[];
  total: number;
  page: number;
  pageSize: number;
}

// Un destacado vigente
export interface FeaturedItem {
  id: string;
  projectId: string;
  durationDays: number;
  startsAt: string;
  endsAt: string;
  status: string;
  projectNickname: string;
  ownerUsername: string;
}

export interface FeaturedLists {
  activeList: FeaturedItem[];
  endingSoon: FeaturedItem[];
}
