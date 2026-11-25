import { Component, computed, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CodeInput } from '../../shared/code-input/code-input';
import { Countdown } from '../../shared/countdown/countdown';
import { AuthService } from '../../../services/auth.service';

const CODE_MINUTES = 15;
const RESEND_SECONDS = 60;
const MAX_ATTEMPTS = 5;

//Pantalla de verificación de código
@Component({
  selector: 'app-verify-code',
  imports: [RouterLink, CodeInput, Countdown],
  templateUrl: './verify-code.html',
  styleUrl: './verify-code.css'
})
export class VerifyCode {
  email = signal('');
  code = signal('');
  attempts = signal(MAX_ATTEMPTS);
  error = signal('');
  message = signal('');
  sending = signal(false);
  expired = signal(false);
  canResend = signal(false);
  restart = signal(0);

  readonly codeSeconds = CODE_MINUTES * 60;
  readonly resendSeconds = RESEND_SECONDS;
  readonly maxAttempts = MAX_ATTEMPTS;

  private codeInput = viewChild(CodeInput);

  maskedEmail = computed(() => {
    const [user, domain] = this.email().split('@');
    return user && domain ? `${user[0]}•••••@${domain}` : this.email();
  });

  constructor(private route: ActivatedRoute, private router: Router, private authService: AuthService) {
    this.email.set(this.route.snapshot.queryParamMap.get('email') ?? '');
  }

  verify(event: Event): void {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    const code = data.get('code') as string;
    if (code.length !== 6 || this.expired()) return;

    this.error.set('');
    this.message.set('');
    this.sending.set(true);
    this.authService.verifyEmail(this.email(), code).subscribe({
      next: (response) => {
        // El backend ya dejó la cookie de sesión, así que entra directo
        this.authService.user.set(response.user);
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.sending.set(false);
        this.attempts.update(n => Math.max(0, n - 1));
        this.error.set(error.error?.message || 'No se pudo verificar el código.');
        this.codeInput()?.reset();
      }
    });
  }

  resend(): void {
    if (!this.canResend()) return;
    this.error.set('');
    this.authService.resendCode(this.email()).subscribe({
      next: (response) => {
        // Con un código nuevo se reinician los intentos y los dos temporizadores
        this.message.set(response.message);
        this.attempts.set(MAX_ATTEMPTS);
        this.expired.set(false);
        this.canResend.set(false);
        this.restart.update(n => n + 1);
        this.codeInput()?.reset();
      },
      error: (error) => this.error.set(error.error?.message || 'No se pudo reenviar el código.')
    });
  }
}