import { HttpInterceptorFn } from '@angular/common/http';

// El JWT va en una cookie httpOnly, así que cada petición lleva withCredentials
// para que el navegador la mande y no haya que repetirlo en cada servicio
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};