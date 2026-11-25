export interface ReportReason {
  id: string;
  code: string;
  name: string;
  requiresDetail: boolean;
  sortOrder: number;
}
 
// Datos que se mandan al reportar
export interface ReportData {
  targetType: 'project' | 'comment';
  targetId: string;
  reasonId: string;
  detail: string;
}