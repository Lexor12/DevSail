import { Routes } from '@angular/router';
import { guestGuard } from './guards/guest-guard';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';
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
import { RecoverPassword } from './components/pages/recover-password/recover-password';
import { DeleteAccount } from './components/pages/delete-account/delete-account';
import { Legal } from './components/pages/legal/legal';
import { NotFound } from './components/pages/not-found/not-found';
import { AdminDashboard } from './components/pages/admin-dashboard/admin-dashboard';
import { AdminReports } from './components/pages/admin-reports/admin-reports';
import { AdminReportDetail } from './components/pages/admin-report-detail/admin-report-detail';
import { AdminProjects } from './components/pages/admin-projects/admin-projects';
import { AdminComments } from './components/pages/admin-comments/admin-comments';
import { AdminFeatured } from './components/pages/admin-featured/admin-featured';
import { AdminIncome } from './components/pages/admin-income/admin-income';
 
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
  {
    path: 'auth/recover',
    title: 'Recuperar contraseña DevSail',
    canActivate: [guestGuard],
    component: RecoverPassword
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
  {
    path: 'my-account/delete',
    title: 'Zona de peligro DevSail',
    canActivate: [authGuard],
    component: DeleteAccount
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
 
  // Avisos legales, se abren desde el pie de página
  {
    path: 'legal/:page',
    title: 'Avisos legales DevSail',
    component: Legal
  },
 
  // Panel del administrador, solo con rol admin
  {
    path: 'admin',
    title: 'Panel DevSail',
    canActivate: [adminGuard],
    component: AdminDashboard
  },
  {
    path: 'admin/reports',
    title: 'Reportes DevSail',
    canActivate: [adminGuard],
    component: AdminReports
  },
  {
    path: 'admin/reports/:id',
    title: 'Detalle del reporte DevSail',
    canActivate: [adminGuard],
    component: AdminReportDetail
  },
  {
    path: 'admin/projects',
    title: 'Proyectos DevSail',
    canActivate: [adminGuard],
    component: AdminProjects
  },
  {
    path: 'admin/comments',
    title: 'Comentarios DevSail',
    canActivate: [adminGuard],
    component: AdminComments
  },
  {
    path: 'admin/featured',
    title: 'Destacados DevSail',
    canActivate: [adminGuard],
    component: AdminFeatured
  },
  {
    path: 'admin/income',
    title: 'Ingresos DevSail',
    canActivate: [adminGuard],
    component: AdminIncome
  },
 
  // Cualquier otra dirección muestra la pantalla 404
  {
    path: '**',
    title: 'Página no encontrada DevSail',
    component: NotFound
  }
];