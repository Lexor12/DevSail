import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { API_URL } from '../config/api';
import { ProjectCatalogs } from '../models/catalog.model';

@Injectable({
    providedIn: 'root'
})
export class CatalogService {
    private api = `${API_URL}/catalogs`;
    private catalogs$?: Observable<ProjectCatalogs>;

    constructor(private http: HttpClient) {}

    // Tipos y tecnologías se piden una vez y se reutilizan en toda la app
    getProjectCatalogs(): Observable<ProjectCatalogs> {
        if (!this.catalogs$) {
        this.catalogs$ = this.http.get<ProjectCatalogs>(`${this.api}/projects`).pipe(shareReplay(1));
        }
        return this.catalogs$;
    }
}