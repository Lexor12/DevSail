import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Las pantallas del panel solo las ve el administrador
// Sin sesión manda a iniciar sesión y con otra cuenta regresa al inicio
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.getSession().pipe(
    map(user => {
      authService.user.set(user);
      return user.role === 'admin' ? true : router.createUrlTree(['/']);
    }),
    catchError(() => of(router.createUrlTree(['/auth/login'])))
  );
};