import { Injectable, inject } from '@angular/core';
import { ApiConfiguration } from '../../api/api-configuration';

/**
 * @description Cliente API basado en Promesas y Fetch (Blueprint 2026).
 * Elimina la dependencia de RxJS y permite control total Zoneless.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private config = inject(ApiConfiguration);

  /**
   * @description Ejecuta peticiones HTTP nativas.
   * @param path Ruta del endpoint (ej: '/users/me')
   * @param options Opciones de Fetch (method, body, headers)
   */
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${this.config.rootUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    // Gestión de seguridad: Si hay 401 y no es login, fuera.
    if (response.status === 401 && !path.includes('/auth/login')) {
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw error;
    }

    return response.json() as Promise<T>;
  }

  // Helpers rápidos para cumplir concisión
  get<T>(path: string) { return this.request<T>(path, { method: 'GET' }); }
  post<T>(path: string, body: any) { return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) }); }
}