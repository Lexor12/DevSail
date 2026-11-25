import { Routes } from '@angular/router';
import { guestGuard } from './guards/guest-guard';
 
// Cada página se carga solo cuando se visita (loadComponent)
export const routes: Routes = [
  {
    path: '',
    title: 'DevSail',
    loadComponent: () => import('./components/pages/home/home').then(m => m.Home)
  },
  {
    path: 'explore',
    title: 'Explorar proyectos · DevSail',
    loadComponent: () => import('./components/pages/explore/explore').then(m => m.Explore)
  },
  {
    path: 'auth/login',
    title: 'Iniciar sesión · DevSail',
    canActivate: [guestGuard],
    data: { mode: 'login' },
    loadComponent: () => import('./components/pages/auth/auth').then(m => m.Auth)
  },
  {
    path: 'auth/register',
    title: 'Crear cuenta · DevSail',
    canActivate: [guestGuard],
    data: { mode: 'register' },
    loadComponent: () => import('./components/pages/auth/auth').then(m => m.Auth)
  },
  {
    path: 'auth/verify',
    title: 'Verifica tu correo · DevSail',
    canActivate: [guestGuard],
    loadComponent: () => import('./components/pages/verify-code/verify-code').then(m => m.VerifyCode)
  },
  // Cualquier otra dirección regresa al inicio (después se cambia por la pantalla 18 «404»)
  { path: '**', redirectTo: '' }
];