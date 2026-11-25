import { Routes } from '@angular/router';
import { guestGuard } from './guards/guest-guard';
import { authGuard } from './guards/auth-guard';
 
// Cada página se carga solo cuando se visita (loadComponent)
export const routes: Routes = [
  // 01 a 05
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
 
  // 06 y 07: se ven con o sin sesión
  {
    path: 'projects/:id',
    title: 'Proyecto · DevSail',
    loadComponent: () => import('./components/pages/project-detail/project-detail').then(m => m.ProjectDetail)
  },
  {
    path: 'u/:username',
    title: 'Perfil · DevSail',
    loadComponent: () => import('./components/pages/public-profile/public-profile').then(m => m.PublicProfile)
  },
 
  // 08 a 12: Mi cuenta (piden sesión)
  { path: 'my-account', redirectTo: 'my-account/data', pathMatch: 'full' },
  {
    path: 'my-account/data',
    title: 'Mis datos · DevSail',
    canActivate: [authGuard],
    loadComponent: () => import('./components/pages/account-data/account-data').then(m => m.AccountData)
  },
  {
    path: 'my-account/projects',
    title: 'Mis proyectos · DevSail',
    canActivate: [authGuard],
    loadComponent: () => import('./components/pages/my-projects/my-projects').then(m => m.MyProjects)
  },
  {
    path: 'my-account/saved',
    title: 'Guardados · DevSail',
    canActivate: [authGuard],
    loadComponent: () => import('./components/pages/saved/saved').then(m => m.Saved)
  },
  {
    path: 'my-account/plan',
    title: 'Plan y pagos · DevSail',
    canActivate: [authGuard],
    loadComponent: () => import('./components/pages/plan-payments/plan-payments').then(m => m.PlanPayments)
  },
  {
    path: 'my-account/stats',
    title: 'Estadísticas · DevSail',
    canActivate: [authGuard],
    loadComponent: () => import('./components/pages/stats/stats').then(m => m.Stats)
  },
 
  // Regreso de PayPal (return_url y cancel_url del backend)
  {
    path: 'payments/return',
    title: 'Resultado de pago · DevSail',
    canActivate: [authGuard],
    data: { mode: 'return' },
    loadComponent: () => import('./components/pages/payment-result/payment-result').then(m => m.PaymentResult)
  },
  {
    path: 'payments/cancel',
    title: 'Resultado de pago · DevSail',
    canActivate: [authGuard],
    data: { mode: 'cancel' },
    loadComponent: () => import('./components/pages/payment-result/payment-result').then(m => m.PaymentResult)
  },
 
  // Cualquier otra dirección regresa al inicio (después la cambiamos por la pantalla 404)
  { path: '**', redirectTo: '' }
];