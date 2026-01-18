import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { SessionService } from '../services/session.service';

/**
 * @description Guardián de seguridad funcional (Blueprint 2026).
 * Implementa Bypass para roles de plataforma (SUPERADMIN/ADMIN).
 * * @author Gemini Blueprint 2026
 * @version 1.2.0
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot, 
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const router = inject(Router);
  const session = inject(SessionService); // Inyectamos el servicio de sesión
  
  const token = localStorage.getItem('access_token');
  const companyId = localStorage.getItem('selected_company_id');
  
  // Obtenemos el rol desde el Signal de la sesión
  const user = session.user();
  const isPlatformAdmin = user?.appRole === 'SUPERADMIN' || user?.appRole === 'ADMIN';

  // --- 1. VALIDACIÓN DE AUTENTICACIÓN ---
  if (!token) {
    return router.parseUrl('/login');
  }

  // --- 2. VALIDACIÓN DE CONTEXTO ---
  /**
   * Las rutas de configuración de contexto son excepciones para evitar bucles.
   */
  const isGoingToContextSetup: boolean = 
    state.url.includes('/select-company') || 
    state.url.includes('/create-company');
  
  /**
   * Lógica de Bypass:
   * Si NO tiene empresa Y NO es admin de plataforma Y NO va a configurar contexto...
   * entonces obligamos a seleccionar empresa.
   */
  if (!companyId && !isPlatformAdmin && !isGoingToContextSetup) {
    return router.parseUrl('/select-company');
  }

  return true;
};