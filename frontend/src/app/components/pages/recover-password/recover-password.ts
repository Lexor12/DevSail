import { Component, computed, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeInput } from '../../shared/code-input/code-input';
import { Countdown } from '../../shared/countdown/countdown';
import { AuthService } from '../../../services/auth.service';

const CODE_MINUTES = 15;
const RESEND_SECONDS = 60;

//Este componente permite recuperar la contraseña de un usuario en dos pasos
//1. escribe su correo y le llega un código
//2. escribe el código y su nueva contraseña
@Component({
  selector: 'app-recover-password',
  imports: [RouterLink, CodeInput, Countdown],
  templateUrl: './recover-password.html',
  styleUrl: './recover-password.css'
})
export class RecoverPassword {
  step = signal<'email' | 'code' | 'done'>('email');
  email = signal('');
  code = signal('');
  password = signal('');
  confirmPassword = signal('');
  showPassword = signal(false);
  error = signal('');
  message = signal('');
  sending = signal(false);
  expired = signal(false);
  canResend = signal(false);
  restart = signal(0);

  readonly codeSeconds = CODE_MINUTES * 60;
  readonly resendSeconds = RESEND_SECONDS;

  private codeInput = viewChild(CodeInput);

  // Las mismas reglas que pide el backend para la contraseña
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

  isValid = computed(() =>
    this.code().length === 6 &&
    this.rules().every(rule => rule.ok) &&
    this.confirmPassword() === this.password() &&
    !this.expired()
  );

  constructor(private authService: AuthService) {}

  // Paso 1: pide el código
  sendCode(event: Event): void {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    const email = ((data.get('email') as string) || '').trim().toLowerCase();
    if (!email) {
      this.error.set('Escribe tu correo.');
      return;
    }

    this.error.set('');
    this.sending.set(true);
    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        // El backend responde lo mismo exista o no el correo, por seguridad
        this.email.set(email);
        this.message.set(response.message);
        this.sending.set(false);
        this.step.set('code');
      },
      error: (error) => {
        this.sending.set(false);
        this.error.set(error.error?.message || 'No se pudo enviar el código.');
      }
    });
  }

  // Lee los campos de contraseña en cada tecla para validar en vivo
  check(form: HTMLFormElement): void {
    const data = new FormData(form);
    this.password.set((data.get('password') as string) || '');
    this.confirmPassword.set((data.get('confirmPassword') as string) || '');
  }

  // Paso 2: cambia la contraseña
  reset(event: Event): void {
    event.preventDefault();
    if (!this.isValid()) return;

    this.error.set('');
    this.message.set('');
    this.sending.set(true);
    this.authService.resetPassword(this.email(), this.code(), this.password()).subscribe({
      next: (response) => {
        this.message.set(response.message);
        this.sending.set(false);
        this.step.set('done');
      },
      error: (error) => {
        this.sending.set(false);
        this.error.set(error.error?.message || 'No se pudo cambiar la contraseña.');
        this.codeInput()?.reset();
      }
    });
  }
  resend(): void {
    if (!this.canResend()) return;
    this.error.set('');
    this.authService.forgotPassword(this.email()).subscribe({
      next: (response) => {
        // Con un código nuevo se reinician los dos temporizadores
        this.message.set(response.message);
        this.expired.set(false);
        this.canResend.set(false);
        this.restart.update(n => n + 1);
        this.codeInput()?.reset();
      },
      error: (error) => this.error.set(error.error?.message || 'No se pudo reenviar el código.')
    });
  }
  // Regresa al paso 1 por si escribió mal el correo
  changeEmail(): void {
    this.step.set('email');
    this.message.set('');
    this.error.set('');
  }
}