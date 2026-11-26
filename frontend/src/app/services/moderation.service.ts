import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api';
import { AdminCommentList, AdminProjectList, FeaturedLists } from '../models/moderation.model';

type Message = { message: string };

// Moderación de proyectos, comentarios y destacados del administrador
// Ocultar siempre pide un motivo, mostrar no
@Injectable({
  providedIn: 'root'
})
export class ModerationService {
  private api = `${API_URL}/admin`;

  constructor(private http: HttpClient) {}

  // status puede ser published, deactivated, hidden o vacío para todos
  getProjects(status: string, text: string, page: number): Observable<AdminProjectList> {
    let params = new HttpParams().set('page', page).set('pageSize', 10);
    if (status) params = params.set('status', status);
    if (text) params = params.set('text', text);
    return this.http.get<AdminProjectList>(`${this.api}/projects`, { params });
  }

  setProjectVisibility(id: string, action: 'hide' | 'show', reason: string): Observable<Message> {
    return this.http.patch<Message>(`${this.api}/projects/${id}/visibility`, { action, reason });
  }

  // hidden puede ser 'true', 'false' o vacío para todos
  getComments(hidden: string, page: number): Observable<AdminCommentList> {
    let params = new HttpParams().set('page', page).set('pageSize', 10);
    if (hidden) params = params.set('hidden', hidden);
    return this.http.get<AdminCommentList>(`${this.api}/comments`, { params });
  }

  setCommentVisibility(id: string, action: 'hide' | 'show', reason: string): Observable<Message> {
    return this.http.patch<Message>(`${this.api}/comments/${id}/visibility`, { action, reason });
  }

  getFeatured(): Observable<FeaturedLists> {
    return this.http.get<FeaturedLists>(`${this.api}/featured`);
  }

  removeFeatured(projectId: string, reason: string): Observable<Message> {
    return this.http.patch<Message>(`${this.api}/featured/${projectId}/remove`, { reason });
  }
}
