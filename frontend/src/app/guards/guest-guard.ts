import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Si ya hay sesión, estas pantallas no se deberían mostrar.
// Si no hay sesión o falla la consulta, deja pasar al usuario.
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getSession().pipe(
    // pipe sirve para encadenar operadores que trabajan con la respuesta.
    map(() => router.createUrlTree(['/'])),
    // Si la consulta falla, devuelve true para dejar pasar al usuario.
    catchError(() => of(true))
  );
};