// Datos del panel del administrador: resumen y reportes
 
// Las 6 tarjetas del resumen
export interface DashboardSummary {
  pendingReports: number;
  hiddenProjects: number;
  hiddenComments: number;
  activeFeatured: number;
  activeProPlans: number;
  monthIncome: number;
}
export type ReportStatus = 'pending' | 'resolved_hidden' | 'dismissed';
export type ReportTargetType = 'project' | 'comment';
 
// Fila de la lista de reportes
export interface ReportListItem {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  contentSummary: string | null;
  lastReasonName: string | null;
  lastReporterUsername: string | null;
  reportsCount: number;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}
export interface ReportList {
  reports: ReportListItem[];
  total: number;
  page: number;
  pageSize: number;
}
// Filtros de la lista de reportes
export interface ReportFilters {
  status: string;
  targetType: string;
  page: number;
}
// Datos generales de un reporte
export interface Report {
  id: string;
  targetType: ReportTargetType;
  projectId: string | null;
  ratingId: string | null;
  status: ReportStatus;
  reportsCount: number;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}
// Cada persona que reportó
export interface ReportEntry {
  id: string;
  reporterUsername: string | null;
  reasonName: string;
  detail: string | null;
  createdAt: string;
}
// Lo reportado: un proyecto o una calificación con comentario
// Los campos cambian según el tipo, por eso casi todos son opcionales
export interface ReportTarget {
  id: string;
  title?: string;
  nickname?: string;
  description?: string;
  ownerUsername?: string;
  status?: string;
  projectId?: string;
  comment?: string | null;
  average?: number | string;
  commentHidden?: boolean;
}
export interface ReportDetail {
  report: Report;
  entries: ReportEntry[];
  targetContent: ReportTarget | null;
}