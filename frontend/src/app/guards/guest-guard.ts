import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
 
// Las pantallas de iniciar sesión, registro y verificación solo se ven sin sesión.
// Le pregunta al backend si la cookie sigue vigente; si sí, manda al inicio.
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
 
  return authService.getSession().pipe(
    map(() => router.createUrlTree(['/'])),
    catchError(() => of(true))
  );
};