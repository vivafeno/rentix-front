import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { createLinkedSignal } from '@angular/core/primitives/signals';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * @description Interceptor de Seguridad (Blueprint 2026).
 * Gestiona la inyección de JWT y el blindaje ante errores de sesión.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');
  let authReq = req;
  if (token) {
    authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(authReq).pipe(
    catchError((error) => {
      // 🚩 BLUEPRINT 2026: Bypass para GetMe y Selección de Empresa
      const isHandshake = req.url.includes('/users/me') || req.url.includes('/context/select-company');
      console.log('**************************');
      if (error.status === 401 && !isHandshake) {
        localStorage.clear();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};