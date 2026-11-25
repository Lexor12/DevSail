import { Routes } from '@angular/router';
import { guestGuard } from './guards/guest-guard';
import { authGuard } from './guards/auth-guard';
import { Home } from './components/pages/home/home';
import { Explore } from './components/pages/explore/explore';
import { Auth } from './components/pages/auth/auth';
import { VerifyCode } from './components/pages/verify-code/verify-code';
import { ProjectDetail } from './components/pages/project-detail/project-detail';
import { PublicProfile } from './components/pages/public-profile/public-profile';
import { AccountData } from './components/pages/account-data/account-data';
import { MyProjects } from './components/pages/my-projects/my-projects';
import { Saved } from './components/pages/saved/saved';
import { PlanPayments } from './components/pages/plan-payments/plan-payments';
import { Stats } from './components/pages/stats/stats';
import { PaymentResult } from './components/pages/payment-result/payment-result';

export const routes: Routes = [
  //Página principal
  {
    path: '',//Es la primera pagina asi que no ponemos alguna ruta
    title: 'DevSail',
    component: Home
  },
  {
    path: 'explore',
    title: 'Explorar proyectos DevSail',
    component: Explore
  },
  {
    path: 'auth/login',
    title: 'Iniciar sesión DevSail',
    canActivate: [guestGuard],
    data: { mode: 'login' },
    component: Auth
  },
  {
    path: 'auth/register',
    title: 'Crear cuenta DevSail',
    canActivate: [guestGuard],
    data: { mode: 'register' },
    component: Auth
  },
  {
    path: 'auth/verify',
    title: 'Verifica tu correo DevSail',
    canActivate: [guestGuard],
    component: VerifyCode
  },

  // Se ven con o sin sesión
  {
    path: 'projects/:id',
    title: 'Proyecto DevSail',
    component: ProjectDetail
  },
  {
    path: 'u/:username',
    title: 'Perfil DevSail',
    component: PublicProfile
  },
  // Pantallas de Mi cuenta, piden sesión
  { path: 'my-account', redirectTo: 'my-account/data', pathMatch: 'full' },
  {
    path: 'my-account/data',
    title: 'Mis datos DevSail',
    canActivate: [authGuard],
    component: AccountData
  },
  {
    path: 'my-account/projects',
    title: 'Mis proyectos DevSail',
    canActivate: [authGuard],
    component: MyProjects
  },
  {
    path: 'my-account/saved',
    title: 'Guardados DevSail',
    canActivate: [authGuard],
    component: Saved
  },
  {
    path: 'my-account/plan',
    title: 'Plan y pagos DevSail',
    canActivate: [authGuard],
    component: PlanPayments
  },
  {
    path: 'my-account/stats',
    title: 'Estadísticas DevSail',
    canActivate: [authGuard],
    component: Stats
  },

  // Regreso de PayPal, ya sea que se complete o se cancele
  {
    path: 'payments/return',
    title: 'Resultado de pago DevSail',
    canActivate: [authGuard],
    data: { mode: 'return' },
    component: PaymentResult
  },
  {
    path: 'payments/cancel',
    title: 'Resultado de pago DevSail',
    canActivate: [authGuard],
    data: { mode: 'cancel' },
    component: PaymentResult
  },

  // Cualquier otra dirección regresa al inicio, después la cambiamos por la pantalla 404
  { path: '**', redirectTo: '' }
];