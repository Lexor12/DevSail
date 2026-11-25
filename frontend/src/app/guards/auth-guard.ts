import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Mi cuenta y el regreso de PayPal piden sesión
// Si la cookie ya no sirve manda a iniciar sesión
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.getSession().pipe(
    map(user => {
      authService.user.set(user);
      return true;
    }),
    catchError(() => of(router.createUrlTree(['/auth/login'])))
  );
};