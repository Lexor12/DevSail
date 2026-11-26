import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api';
import { DashboardSummary, ReportDetail, ReportFilters, ReportList } from '../models/admin.model';
 
type Message = { message: string };
 
// Resumen y reportes del panel del administrador
// Todas las rutas /api/admin piden sesión con rol admin
@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private api = `${API_URL}/admin`;
 
  constructor(private http: HttpClient) {}
 
  getDashboard(): Observable<{ summary: DashboardSummary }> {
    return this.http.get<{ summary: DashboardSummary }>(`${this.api}/dashboard`);
  }
 
  // Solo se mandan los filtros que tienen valor
  getReports(filters: ReportFilters): Observable<ReportList> {
    let params = new HttpParams().set('page', filters.page).set('pageSize', 10);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.targetType) params = params.set('targetType', filters.targetType);
    return this.http.get<ReportList>(`${this.api}/reports`, { params });
  }
 
  getReport(id: string): Observable<ReportDetail> {
    return this.http.get<ReportDetail>(`${this.api}/reports/${id}`);
  }
 
  // decision: hide oculta el contenido, dismiss descarta el reporte
  resolveReport(id: string, decision: 'hide' | 'dismiss', reason: string): Observable<Message> {
    return this.http.patch<Message>(`${this.api}/reports/${id}/resolve`, { decision, reason });
  }
}