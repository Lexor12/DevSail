import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api';
import { RatingData, RatingsResponse } from '../models/rating.model';
import { ProjectSummary } from '../models/project.model';

type Message = { message: string };

@Injectable({
  providedIn: 'root'
})
export class RatingService {
  private api = `${API_URL}/ratings`;

  constructor(private http: HttpClient) {}

  // sort: 'recent', 'highest' o 'lowest'
  getRatings(projectId: string, sort: string, page: number): Observable<RatingsResponse> {
    const params = new HttpParams().set('sortBy', sort).set('page', page).set('pageSize', 10);
    return this.http.get<RatingsResponse>(`${this.api}/project/${projectId}`, { params });
  }

  // Sirve para calificar por primera vez y para editar mi calificación
  rate(projectId: string, data: RatingData): Observable<Message> {
    return this.http.post<Message>(`${this.api}/project/${projectId}`, data);
  }

  deleteMyRating(projectId: string): Observable<Message> {
    return this.http.delete<Message>(`${this.api}/project/${projectId}`);
  }

  // Guarda o quita de guardados (el backend decide según cómo esté)
  toggleSave(projectId: string): Observable<{ saved: boolean; message: string }> {
    return this.http.post<{ saved: boolean; message: string }>(`${this.api}/saved/${projectId}`, {});
  }

  // sort: 'recent' o 'rated'
  getSaved(sort: string): Observable<{ projects: ProjectSummary[] }> {
    const params = new HttpParams().set('sortBy', sort);
    return this.http.get<{ projects: ProjectSummary[] }>(`${this.api}/saved`, { params });
  }
}