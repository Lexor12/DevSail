import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Tabs } from '../../shared/tabs/tabs';
import { LoginForm } from './login-form/login-form';
import { RegisterForm } from './register-form/register-form';

//Este componente lo que hace es integrar los componentes Iniciar sesión y Registro
// Es la misma pantalla: la tarjeta con pestañas cambia de formulario según la ruta
@Component({
  selector: 'app-auth',
  imports: [Tabs, LoginForm, RegisterForm],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class Auth {
  mode = signal<'login' | 'register'>('login');

  readonly options = [
    { value: 'login', text: 'Iniciar sesión' },
    { value: 'register', text: 'Crear cuenta' }
  ];

  constructor(private route: ActivatedRoute, private router: Router) {
    this.route.data.subscribe(data => this.mode.set(data['mode'] ?? 'login'));
  }

  changeMode(mode: string): void {
    this.router.navigate(['/auth', mode]);
  }
}