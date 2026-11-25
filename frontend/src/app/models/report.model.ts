export interface ReportReason {
  id: string;
  code: string;
  name: string;
  requiresDetail: boolean;
  sortOrder: number;
}
 
// Cuerpo de POST /api/reports
export interface ReportData {
  targetType: 'project' | 'comment';
  targetId: string;
  reasonId: string;
  detail: string;
}