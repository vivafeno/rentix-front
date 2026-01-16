import { Routes } from '@angular/router';
import { CompanySettingsComponent } from './features/company-settings/company-settings';

// NO importamos los componentes arriba (Static imports), usamos import dinámico abajo.
// Solo importamos AuthGuard si lo tuviéramos (lo haremos luego).

export const routes: Routes = [
  // 1. Rutas Públicas (Lazy Loaded)
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'select-company',
    loadComponent: () => import('./features/auth/select-company/select-company').then(m => m.SelectCompanyComponent)
  },
  {
    path: 'create-company',
    loadComponent: () => import('./features/companies/create-company/create-company')
      .then(m => m.CreateCompanyComponent)
  },

  // 2. Rutas Privadas (Layout Container)
  {
    path: 'app',
    // Cargamos el Layout también de forma perezosa
    loadComponent: () => import('./core/layout/main-layout/main-layout').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/company-settings/company-settings').then(m => m.CompanySettingsComponent)
      },
      {       
        path: 'properties',
        loadComponent: () => import('./features/properties/property-list/property-list').then(m=> m.PropertyListComponent)
      },
      {
        path: 'properties/new',
        loadComponent: () => import('./features/properties/create-property/create-property').then(m => m.CreatePropertyComponent)
      },
      // Aquí añadiremos 'taxes' en el futuro
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },

  // 3. Redirecciones Default
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: '**',
    loadComponent: () => import('./core/pages/not-found/not-found').then(m => m.NotFoundComponent)
  },
];