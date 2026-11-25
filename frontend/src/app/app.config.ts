import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
 
import { routes } from './app.routes';
import { credentialsInterceptor } from './interceptors/credentials-interceptor';
 
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Al cambiar de página se regresa al inicio de la pantalla
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    // HttpClient con el interceptor que manda la cookie de sesión en cada petición
    provideHttpClient(withInterceptors([credentialsInterceptor]))
  ]
};