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
    //Las variables que terminan con $ son Observables

    constructor(private http: HttpClient) {}

    // Tipos de proyecto y tecnologías. Se piden una sola vez y se reutilizan en toda la app
    getProjectCatalogs(): Observable<ProjectCatalogs> {
        if (!this.catalogs$) {
        this.catalogs$ = this.http.get<ProjectCatalogs>(`${this.api}/projects`).pipe(shareReplay(1));
        //shareReplay(1) recuerda la última respuesta y se la da a todos los que se suscriban después
        //Esto pues pq los tipos y tecnologias casi nunca cambian
        }
        return this.catalogs$;
    }
}