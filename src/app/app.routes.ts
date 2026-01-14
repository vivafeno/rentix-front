import { Routes } from '@angular/router';

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
      // Aquí añadiremos 'taxes' en el futuro
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // 3. Redirecciones Default
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];