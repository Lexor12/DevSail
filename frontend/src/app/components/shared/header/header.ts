import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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

  constructor(public authService: AuthService) {}

  toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }
}