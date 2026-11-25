// Mi calificación de un proyecto, viene en myRating
export interface Rating {
  id: string;
  scoreDesign: number;
  scoreUsefulness: number;
  scoreCodeQuality: number;
  scoreDocumentation: number;
  scoreInnovation: number;
  average: number;
  comment: string | null;
  commentHidden: boolean;
}
 
// Calificación de otra persona en la lista de comentarios
export interface RatingItem {
  id: string;
  userId: string;
  authorUsername: string;
  authorFullName: string;
  authorAvatarUrl: string | null;
  average: number;
  comment: string | null;
  isEdited: boolean;
  commentHidden: boolean;
  createdAt: string;
}
 
// Respuesta de la lista de calificaciones
export interface RatingsResponse {
  ratings: RatingItem[];
  total: number;
  page: number;
  pageSize: number;
}
 
// Datos que se mandan al calificar
export interface RatingData {
  scoreDesign: number;
  scoreUsefulness: number;
  scoreCodeQuality: number;
  scoreDocumentation: number;
  scoreInnovation: number;
  comment: string;
}