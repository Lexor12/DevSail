import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

//Si no tienes una cuenta creada, entonces te redirije a login, esta se usa en todas las rutas que requieran estar con una sesión iniciada
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