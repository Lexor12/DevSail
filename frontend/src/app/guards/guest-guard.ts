import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Si ya hay sesión estas pantallas no se muestran
// Si no hay sesión o falla la consulta deja pasar
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getSession().pipe(
    // pipe encadena operadores sobre la respuesta
    map(() => router.createUrlTree(['/'])),
    // Si la consulta falla regresa true para dejar pasar
    catchError(() => of(true))
  );
};