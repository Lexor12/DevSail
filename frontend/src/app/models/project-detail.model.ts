import { Rating } from './rating.model';
 
export interface ProjectImage {
  id: string;
  projectId: string;
  storagePath: string;
  position: number;
}
 
export interface ProjectTechnology {
  id: string;
  name: string;
}
 
// Detalle completo de un proyecto, igual que ProjectDetail del backend
export interface ProjectDetailData {
  id: string;
  ownerId: string;
  ownerUsername: string;
  ownerFullName: string;
  ownerAvatarPath: string | null;
  projectTypeId: string;
  typeCode: string;
  typeName: string;
  title: string;
  nickname: string;
  description: string;
  repositoryUrl: string;
  repositoryPlatform: string;
  demoUrl: string | null;
  status: 'published' | 'deactivated' | 'hidden';
  hiddenReason: string | null;
  seekingFeedback: boolean;
  openToCollaborate: boolean;
  avgDesign: number | string | null;
  avgUsefulness: number | string | null;
  avgCodeQuality: number | string | null;
  avgDocumentation: number | string | null;
  avgInnovation: number | string | null;
  avgOverall: number | string | null;
  ratingsCount: number;
  savesCount: number;
  isFeatured: boolean;
  publishedAt: string;
  images: ProjectImage[];
  technologies: ProjectTechnology[];
}
 
// Respuesta del detalle
export interface ProjectDetailResponse {
  project: ProjectDetailData;
  isOwner: boolean;
  isSaved: boolean;
  myRating: Rating | null;
}
 
// Fila de Mis proyectos, igual que OwnerProject del backend
export interface OwnerProject {
  id: string;
  title: string;
  nickname: string;
  status: 'published' | 'deactivated' | 'hidden';
  hiddenReason: string | null;
  coverPath: string | null;
  avgOverall: number | string | null;
  ratingsCount: number;
  savesCount: number;
  totalVisits: number;
  featuredEndsAt: string | null;
  publishedAt: string;
}
 
// Respuesta de Mis proyectos
export interface MyProjectsResponse {
  projects: OwnerProject[];
  isPro: boolean;
  publishedCount: number;
  freeLimit: number;
}
 
// Datos que se mandan al crear o editar un proyecto
export interface ProjectData {
  projectTypeId: string;
  title: string;
  nickname: string;
  description: string;
  repositoryUrl: string;
  demoUrl: string;
  seekingFeedback: boolean;
  openToCollaborate: boolean;
  technologyIds: string[];
  authorshipDeclared?: boolean;
  images?: string[];
}