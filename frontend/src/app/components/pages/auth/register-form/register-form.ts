import { Component, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
 
// Mismas reglas que utils/validators.js del backend, para avisar antes de enviar
const NAME_REGEX = /^[a-zA-ZÀ-ÿñÑ\s]{2,80}$/;
const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 
@Component({
  selector: 'app-register-form',
  imports: [RouterLink],
  templateUrl: './register-form.html',
  styleUrls: ['../auth-form.css', './register-form.css']
})
export class RegisterForm {
  error = signal('');
  sending = signal(false);
  showPassword = signal(false);
 
  // Valores que se revisan en vivo mientras el usuario escribe
  fullName = signal('');
  username = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  accepted = signal(false);
 
  rules = computed(() => {
    const p = this.password();
    return [
      { text: '8 a 64 caracteres', ok: p.length >= 8 && p.length <= 64 },
      { text: 'Una mayúscula', ok: /[A-ZÁÉÍÓÚÑ]/.test(p) },
      { text: 'Una minúscula', ok: /[a-záéíóúñ]/.test(p) },
      { text: 'Un número', ok: /[0-9]/.test(p) }
    ];
  });
 
  mismatch = computed(() => this.confirmPassword() !== '' && this.confirmPassword() !== this.password());
 
  // El botón Crear cuenta se activa cuando todo es válido y la casilla está marcada
  isValid = computed(() =>
    NAME_REGEX.test(this.fullName().trim()) &&
    USERNAME_REGEX.test(this.username()) &&
    EMAIL_REGEX.test(this.email().trim()) &&
    this.rules().every(r => r.ok) &&
    this.confirmPassword() === this.password() &&
    this.accepted()
  );
 
  constructor(private authService: AuthService, private router: Router) {}
 
  // Se llama con cada tecla o clic dentro del formulario; lee todo con FormData
  check(form: HTMLFormElement): void {
    const data = new FormData(form);
    this.fullName.set((data.get('fullName') as string) ?? '');
    this.username.set((data.get('username') as string) ?? '');
    this.email.set((data.get('email') as string) ?? '');
    this.password.set((data.get('password') as string) ?? '');
    this.confirmPassword.set((data.get('confirmPassword') as string) ?? '');
    this.accepted.set(data.get('accept') === 'on');
  }
 
  register(event: Event): void {
    event.preventDefault();
    this.error.set('');
    this.check(event.target as HTMLFormElement);
    if (!this.isValid()) return;
 
    // Una sola casilla acepta el aviso de privacidad y los términos, así que se mandan los dos en true
    this.sending.set(true);
    this.authService.register({
      fullName: this.fullName().trim(),
      username: this.username(),
      email: this.email().trim(),
      password: this.password(),
      confirmPassword: this.confirmPassword(),
      acceptPrivacy: true,
      acceptTerms: true
    }).subscribe({
      next: (response) => {
        this.router.navigate(['/auth/verify'], { queryParams: { email: response.email } });
      },
      error: (error) => {
        this.sending.set(false);
        this.error.set(error.error?.message || 'No se pudo crear la cuenta.');
      }
    });
  }
}