import { HttpInterceptorFn } from '@angular/common/http';

// El backend guarda el JWT en una cookie httpOnly, así que cada petición debe ir con withCredentials
// para que el navegador mande esa cookie, así no se repite en cada servicio
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};