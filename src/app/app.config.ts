import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { ApiConfiguration } from './api/api-configuration';

export const appConfig: ApplicationConfig = {
  providers: [
    // 1. Router Moderno
    provideRouter(routes),
    
    // 2. HTTP Client Moderno (Fetch API + Interceptores Funcionales)
    provideHttpClient(
      withFetch(), // Usa fetch() nativo del navegador (más rápido que XHR)
      withInterceptors([authInterceptor]) // Tu interceptor de tokens
    ),

    // 3. Configuración de la API (Patrón Factory Provider)
    // Instanciamos la configuración manualmente. Angular usará esta instancia
    // cada vez que un servicio pida 'ApiConfiguration'.
    {
      provide: ApiConfiguration,
      useFactory: () => {
        const config = new ApiConfiguration();
        config.rootUrl = 'http://localhost:3000'; // Tu Backend
        return config;
      }
    }
  ]
};