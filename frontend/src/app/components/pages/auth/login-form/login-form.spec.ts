import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
 
@Component({
  selector: 'app-login-form',
  imports: [RouterLink],
  templateUrl: './login-form.html',
  styleUrls: ['../auth-form.css', './login-form.css']
})
export class LoginForm {
  error = signal('');
  sending = signal(false);
  showPassword = signal(false);
 
  constructor(private authService: AuthService, private router: Router) {}
 
  login(event: Event): void {
    event.preventDefault();
    this.error.set('');
 
    // FormData lee los valores del formulario usando el atributo name de cada input
    const data = new FormData(event.target as HTMLFormElement);
    const email = (data.get('email') as string).trim();
    const password = data.get('password') as string;
 
    if (!email || !password) {
      this.error.set('Ingresa tu correo y contraseña.');
      return;
    }
 
    this.sending.set(true);
    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.authService.user.set(response.user);
        // El administrador va a su panel y los demás al inicio
        this.router.navigate([response.user.role === 'admin' ? '/admin' : '/']);
      },
      error: (error) => {
        this.sending.set(false);
        // Si la cuenta no está verificada se manda a la pantalla del código
        if (error.status === 403 && error.error?.needsVerification) {
          this.router.navigate(['/auth/verify'], { queryParams: { email: error.error.email } });
          return;
        }
        this.error.set(error.error?.message || 'No se pudo iniciar sesión.');
      }
    });
  }
}