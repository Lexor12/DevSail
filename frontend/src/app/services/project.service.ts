import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api';
import { HomeProjects, SearchFilters, SearchResult } from '../models/project.model';

@Injectable({
    providedIn: 'root'
})
export class ProjectService {
    private api = `${API_URL}/projects`;
    constructor(private http: HttpClient) {}

    // Las 3 secciones del inicio; period cambia "Mejor valorados" entre semana y mes
    getHome(period: 'week' | 'month' = 'week'): Observable<HomeProjects> {
        const params = new HttpParams().set('period', period);
        return this.http.get<HomeProjects>(`${this.api}/home`, { params });
    }

    // Traduce los filtros de la dirección a los nombres que espera el backend
    search(filters: SearchFilters): Observable<SearchResult> {
        let params = new HttpParams().set('page', filters.page).set('pageSize', filters.pageSize).set('sortBy', filters.sort).set('minRating', filters.minRating).set('maxRating', filters.maxRating);

        if (filters.q) params = params.set('text', filters.q);
        if (filters.type) params = params.set('typeCode', filters.type);
        if (filters.technologies.length > 0) params = params.set('technologies', filters.technologies.join(','));
        if (filters.feedback) params = params.set('seekingFeedback', 'true');
        if (filters.collaborate) params = params.set('openToCollaborate', 'true');
        if (filters.demo) params = params.set('hasDemo', 'true');
        if (filters.featured) params = params.set('onlyFeatured', 'true');

        return this.http.get<SearchResult>(`${this.api}/search`, { params });
    }
}