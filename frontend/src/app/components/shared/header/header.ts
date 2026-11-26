import { Component, computed, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
 
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  // En celular el menú se abre con un botón
  menuOpen = signal(false);
 
  // El administrador ve los enlaces del panel en lugar de los del sitio
  isAdmin = computed(() => this.authService.user()?.role === 'admin');
 
  constructor(public authService: AuthService, private router: Router) {}
 
  toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }
 
  // Cerrar sesión (HU-03): el backend borra la cookie y aquí se olvida al usuario
  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.finishLogout(),
      // Aunque falle la petición, en pantalla se cierra la sesión
      error: () => this.finishLogout()
    });
  }
 
  private finishLogout(): void {
    this.authService.user.set(null);
    this.router.navigate(['/']);
  }
}