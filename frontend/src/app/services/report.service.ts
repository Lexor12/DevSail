import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api';
import { ReportData, ReportReason } from '../models/report.model';
 
@Injectable({
  providedIn: 'root'
})
export class ReportService {
  constructor(private http: HttpClient) {}
 
  getReasons(): Observable<{ reasons: ReportReason[] }> {
    return this.http.get<{ reasons: ReportReason[] }>(`${API_URL}/catalogs/report-reasons`);
  }
 
  create(data: ReportData): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_URL}/reports`, data);
  }
}