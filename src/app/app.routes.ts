import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/**
 * @description Árbol de navegación y configuración de rutas del ecosistema Rentix.
 * * Implementa las siguientes directrices Blueprint 2026:
 * 1. Shell Architecture: Diferenciación clara entre rutas públicas (Auth) y operativas (App Shell).
 * 2. Lazy Loading Total: Todos los componentes de característica se cargan bajo demanda para optimizar el Core Web Vitals.
 * 3. Blindaje Total: Uso sistemático de 'authGuard' para garantizar la integridad de la sesión y el contexto patrimonial.
 * 4. SEO & UX: Definición estricta de títulos de página para trazabilidad en el historial del navegador.
 * * @author Rentix Team
 * @version 1.2.0
 */
export const routes: Routes = [
  /* * ------------------------------------------------------------------
   * SECCIÓN 1: ACCESO Y CONFIGURACIÓN DE CONTEXTO (Auth)
   * ------------------------------------------------------------------ 
   */

  /** @route /login - Punto de entrada para autenticación de usuarios. */
  {
    path: 'login',
    title: 'Rentix - Login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },

  /** @route /select-company - Interfaz de cambio de contexto (Context Overriding). */
  {
    path: 'select-company',
    title: 'Rentix - Selección de Empresa',
    canActivate: [authGuard],
    loadComponent: () => import('./features/auth/select-company/select-company').then(m => m.SelectCompanyComponent)
  },

  /** @route /create-company - Wizard de alta de nuevos patrimonios/empresas. */
  {
    path: 'create-company',
    title: 'Rentix - Alta de Patrimonio',
    canActivate: [authGuard],
    loadComponent: () => import('./features/companies/create-company/create-company').then(m => m.CreateCompanyComponent)
  },

  /* * ------------------------------------------------------------------
   * SECCIÓN 2: SHELL OPERATIVA (Privada)
   * ------------------------------------------------------------------ 
   * Engloba todas las funcionalidades de gestión bajo un Layout común.
   * Requiere validación de token y empresa activa.
   */
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/main-layout/main-layout').then(m => m.MainLayoutComponent),
    children: [
      /** @route /app/dashboard - Consola de mando y métricas. */
      {
        path: 'dashboard',
        title: 'Rentix - Dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent)
      },

      /** @route /app/tenants - Módulo de gestión de arrendatarios y clientes. */
      {
        path: 'tenants',
        children: [
          { path: '', loadComponent: () => import('./features/tenants/tenant-list/tenant-list').then(m => m.TenantListComponent) },
          { path: 'new', loadComponent: () => import('./features/tenants/tenant-form/tenant-form').then(m => m.TenantFormComponent) },
          { path: 'edit/:id', loadComponent: () => import('./features/tenants/tenant-form/tenant-form').then(m => m.TenantFormComponent) }
        ]
      },

      /** @route /app/properties - Módulo de gestión de activos inmobiliarios. */
      {
        path: 'properties',
        children: [
          { path: '', loadComponent: () => import('./features/properties/property-list/property-list').then(m => m.PropertyListComponent) },
          { path: 'new', loadComponent: () => import('./features/properties/create-property/create-property').then(m => m.CreatePropertyComponent) }
        ]
      },

      /** @route /app/taxes - Módulo de configuración tributaria y fiscal. */
      {
        path: 'taxes',
        children: [
          { path: '', loadComponent: () => import('./features/taxes/tax-list/tax-list').then(m => m.TaxListComponent) },
          { path: 'new', loadComponent: () => import('./features/taxes/tax-form/tax-form').then(m => m.TaxFormComponent) },
          { path: 'edit/:id', loadComponent: () => import('./features/taxes/tax-form/tax-form').then(m => m.TaxFormComponent) }
        ]
      },

      /** @route /app/settings - Configuración técnica y de perfil de empresa. */
      {
        path: 'settings',
        title: 'Rentix - Configuración',
        loadComponent: () => import('./features/company-settings/company-settings').then(m => m.CompanySettingsComponent)
      },

      /** @description Redirección interna por defecto hacia el dashboard. */
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  /* * ------------------------------------------------------------------
   * SECCIÓN 3: CONTROL DE FLUJO Y ERRORES
   * ------------------------------------------------------------------ 
   */

  /** @description Raíz de la aplicación: Redirección forzada al login. */
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  /** @route ** - Captura de rutas inexistentes (404 Error Page). */
  {
    path: '**',
    title: 'Rentix - 404 Not Found',
    loadComponent: () => import('./core/pages/not-found/not-found').then(m => m.NotFoundComponent)
  }
];