import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api';
import { RegisterData, SessionResponse, User } from '../models/user.model';
 
type Message = { message: string };
 
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = `${API_URL}/auth`;
 
  // Usuario con sesión activa, es null cuando nadie ha iniciado sesión
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
  resendCode(email: string): Observable<Message> {
    return this.http.post<Message>(`${this.api}/resend-code`, { email });
  }
  getSession(): Observable<User> {
    return this.http.get<User>(`${this.api}/session`);
  }
  // Se llama al abrir la app y recupera al usuario si la cookie sigue vigente
  loadSession(): void {
    this.getSession().subscribe({
      next: (user) => this.user.set(user),
      error: () => this.user.set(null)
    });
  }
  // El backend borra la cookie de sesión
  logout(): Observable<Message> {
    return this.http.post<Message>(`${this.api}/logout`, {});
  }
  // Recuperar contraseña, paso 1: manda un código de 6 dígitos al correo
  forgotPassword(email: string): Observable<Message> {
    return this.http.post<Message>(`${this.api}/forgot-password`, { email });
  }
  // Recuperar contraseña, paso 2: cambia la contraseña con el código
  resetPassword(email: string, code: string, newPassword: string): Observable<Message> {
    return this.http.post<Message>(`${this.api}/reset-password`, { email, code, newPassword });
  }
}