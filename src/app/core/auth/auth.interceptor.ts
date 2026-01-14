import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // 1. Recuperar el token del almacenamiento local
  const token = localStorage.getItem('access_token');

  // 2. Si existe el token, clonamos la petición para añadirle el Header
  let authReq = req;
  
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // 3. Pasamos la petición al siguiente manejador (el Backend)
  return next(authReq).pipe(
    // (Opcional pero recomendado) Manejo básico de errores globales
    catchError((error) => {
      // Si el backend devuelve 401 (Unauthorized), significa que el token caducó o es falso
      if (error.status === 401) {
        localStorage.removeItem('access_token'); // Limpiamos basura
        localStorage.removeItem('refresh_token');
        router.navigate(['/login']); // Mandamos al usuario fuera
      }
      return throwError(() => error);
    })
  );
};