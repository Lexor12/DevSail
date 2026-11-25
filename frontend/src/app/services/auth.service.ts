import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api';
import { RegisterData, SessionResponse, User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = `${API_URL}/auth`;

  // Usuario con sesión activa el null es por si nadie ha iniciado sesión
  user = signal<User | null>(null);

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(`${this.api}/login`, { email, password });
  }

  register(data: RegisterData): Observable<{ message: string; email: string }> {
    return this.http.post<{ message: string; email: string }>(`${this.api}/register`, data);
  }

  verifyEmail(email: string, code: string): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(`${this.api}/verify-email`, { email, code });
  }

  resendCode(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/resend-code`, { email });
  }

  getSession(): Observable<User> {
    return this.http.get<User>(`${this.api}/session`);
  }

  // Se llama al abrir la app, si la cookie sigue vigente, recupera los datos del usuario
  loadSession(): void {
    this.getSession().subscribe({
      next: (user) => this.user.set(user),
      error: () => this.user.set(null)
    });
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/logout`, {});
  }
}