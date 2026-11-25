import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api';
import { MyAccount, PasswordData, ProfileData, ProfileInfo, ProfileStats } from '../models/user.model';
import { ProjectSummary } from '../models/project.model';

type Message = { message: string };

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private api = `${API_URL}/users`;

    constructor(private http: HttpClient) {}

    //Perfil público, sort puede ser recent o rated
    getPublicProfile(username: string, sort: string): Observable<{ profile: ProfileInfo; stats: ProfileStats; projects: ProjectSummary[] }> {
        const params = new HttpParams().set('sortBy', sort);
        return this.http.get<{ profile: ProfileInfo; stats: ProfileStats; projects: ProjectSummary[] }>(`${this.api}/profile/${username}`, { params });
    }

    //Mis datos
    getMyAccount(): Observable<MyAccount> {
        return this.http.get<MyAccount>(`${this.api}/me`);
    }

    updateProfile(data: ProfileData): Observable<Message> {
        return this.http.put<Message>(`${this.api}/me`, data);
    }

    // image es la foto en base64
    updateAvatar(image: string): Observable<{ message: string; avatarPath: string }> {
        return this.http.post<{ message: string; avatarPath: string }>(`${this.api}/me/avatar`, { image });
    }

    removeAvatar(): Observable<Message> {
        return this.http.delete<Message>(`${this.api}/me/avatar`);
    }

    // El cambio de contraseña está en auth pero se usa desde Mis datos
    changePassword(data: PasswordData): Observable<Message> {
        return this.http.put<Message>(`${API_URL}/auth/change-password`, data);
    }
}