import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/**
 * @description Configuración del árbol de navegación del ecosistema Rentix 2026.
 * * Directrices Blueprint 2026 aplicadas:
 * 1. Shell Architecture: Uso de MainLayout como contenedor de la operativa.
 * 2. Zoneless & Lazy Loading: Carga modular de componentes standalone.
 * 3. Contextualización: Rutas protegidas por jerarquía de roles y empresa activa.
 * * @author Gemini Blueprint 2026
 * @version 1.4.0
 */
export const routes: Routes = [
  /**
   * @description Sección 1: Autenticación y Acceso Público.
   */
  {
    path: 'login',
    title: 'Rentix - Acceso de Usuarios',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },

  /**
   * @description Sección 2: Gestión de Contexto.
   * Rutas intermedias para la selección de patrimonio activo.
   */
  {
    path: 'select-company',
    title: 'Rentix - Selección de Empresa',
    canActivate: [authGuard],
    loadComponent: () => import('./features/auth/select-company/select-company').then(m => m.SelectCompanyComponent)
  },

  /**
   * @description Sección 3: Shell Operativa (Privada).
   * Contiene todas las funcionalidades bajo el MainLayoutComponent.
   */
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/main-layout/main-layout').then(m => m.MainLayoutComponent),
    children: [
      /**
       * @description Dashboard principal con métricas globales.
       */
      {
        path: 'dashboard',
        title: 'Rentix - Dashboard Operativo',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent)
      },

      /**
       * @description Wizard de Alta de Patrimonio (ADMIN).
       * Implementa la creación atómica legal y fiscal en una sola vista.
       */
      {
        path: 'create-company',
        title: 'Rentix - Configuración Legal de Empresa',
        loadComponent: () => import('./features/companies/create-company/create-company').then(m => m.CreateCompanyComponent)
      },

      /**
       * @description Gestión de Arrendatarios (Tenants).
       */
      {
        path: 'tenants',
        children: [
          { 
            path: '', 
            title: 'Rentix - Listado de Arrendatarios',
            loadComponent: () => import('./features/tenants/tenant-list/tenant-list').then(m => m.TenantListComponent) 
          },
          { 
            path: 'new', 
            title: 'Rentix - Nuevo Arrendatario',
            loadComponent: () => import('./features/tenants/tenant-form/tenant-form').then(m => m.TenantFormComponent) 
          }
        ]
      },

      /**
       * @description Gestión de Activos Inmobiliarios (Properties).
       */
      {
        path: 'properties',
        children: [
          { 
            path: '', 
            title: 'Rentix - Gestión de Activos',
            loadComponent: () => import('./features/properties/property-list/property-list').then(m => m.PropertyListComponent) 
          },
          { 
            path: 'new', 
            title: 'Rentix - Nuevo Activo',
            loadComponent: () => import('./features/properties/create-property/create-property').then(m => m.CreatePropertyComponent) 
          }
        ]
      },

      /**
       * @description Configuración de Perfil y Preferencias de Empresa.
       */
      {
        path: 'settings',
        title: 'Rentix - Configuración Patrimonial',
        loadComponent: () => import('./features/company-settings/company-settings').then(m => m.CompanySettingsComponent)
      },

      /**
       * @description Redirección por defecto al dashboard operativo.
       */
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  /**
   * @description Sección 4: Control de Flujo Global.
   */
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: '**',
    title: 'Rentix - Error 404',
    loadComponent: () => import('./core/pages/not-found/not-found').then(m => m.NotFoundComponent)
  }
];