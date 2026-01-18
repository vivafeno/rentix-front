import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAngularQuery, QueryClient } from '@tanstack/angular-query-experimental';

import { routes } from './app.routes';
import { ApiConfiguration } from './api/api-configuration';

/**
 * @description Configuración central Rentix 2026.
 * Implementa: Zoneless Change Detection, TanStack Query y Native Fetch.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // 🚩 ELIMINAMOS ZONE.JS: La app ahora es 100% reactiva vía Signals.
    provideZonelessChangeDetection(),

    provideRouter(routes),
    
    // Mantenemos HttpClient con Fetch solo por compatibilidad con los modelos generados,
    // pero nuestro flujo principal será a través del ApiService Nativo.
    provideHttpClient(withFetch()),

    // 🚩 CONFIGURACIÓN TANSTACK QUERY (El sucesor operativo de OpenAPI RxJS)
    provideAngularQuery(new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutos de caché.
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    })),

    // Configuración de la URL base
    {
      provide: ApiConfiguration,
      useFactory: () => {
        const config = new ApiConfiguration();
        config.rootUrl = 'http://localhost:3000';
        return config;
      }
    }
  ]
};