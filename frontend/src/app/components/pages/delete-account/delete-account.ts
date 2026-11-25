import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AccountMenu } from '../../shared/account-menu/account-menu';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';

//Este componente se muestra como sección para eliminar cuenta
// Se confirma escribiendo la contraseña y marcando la casilla
@Component({
  selector: 'app-delete-account',
  imports: [AccountMenu],
  templateUrl: './delete-account.html',
  styleUrl: './delete-account.css'
})
export class DeleteAccount {
  password = signal('');
  understood = signal(false);
  error = signal('');
  sending = signal(false);

  constructor(private userService: UserService, private authService: AuthService, private router: Router) {}

  // Lee los dos campos con cada cambio para habilitar el botón
  check(form: HTMLFormElement): void {
    const data = new FormData(form);
    this.password.set((data.get('password') as string) || '');
    this.understood.set(data.get('understood') === 'on');
  }

  deleteAccount(event: Event): void {
    event.preventDefault();
    if (!this.password() || !this.understood()) return;
    if (!confirm('Esta acción no se puede deshacer. ¿Eliminar tu cuenta?')) return;

    this.error.set('');
    this.sending.set(true);
    this.userService.deleteAccount(this.password()).subscribe({
      next: () => {
        // El backend ya borró la cuenta y la cookie, aquí se olvida al usuario
        this.authService.user.set(null);
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.sending.set(false);
        this.error.set(error.error?.message || 'No se pudo eliminar la cuenta.');
      }
    });
  }
}
