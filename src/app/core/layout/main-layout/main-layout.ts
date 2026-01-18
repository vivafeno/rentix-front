import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { CommonModule } from '@angular/common';

/**
 * @class MainLayoutComponent
 * @description Shell principal de Rentix 2026. 
 * Gestiona la navegación dinámica basada en el contexto patrimonial y roles de seguridad.
 * @author Rentix 2026
 * @version 1.7.0
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayoutComponent {
  private readonly router = inject(Router);
  public readonly session = inject(SessionService);

  /** @description Signal computada: Estado de carga global. */
  readonly isLoading = computed(() => this.session.isLoading());

  /** @description Signal computada: Rol actual en el contexto de la empresa seleccionada. */
  readonly companyRole = computed(() => this.session.currentRole());

  /** * @method menuItems
   * @description Genera el menú dinámico filtrado por jerarquía de roles.
   * Resuelve errores TS2367 mediante el uso de literales de rol actualizados (Blueprint 2026).
   * @returns {Array<{label: string, route: string, icon: string}>}
   */
  readonly menuItems = computed(() => {
    const user = this.session.user();
    const appRole = user?.appRole; 
    const currentRole = this.companyRole(); 
    const hasCompany = !!this.session.companyId();

    /** * @description Banderas de acceso.
     * CORRECCIÓN: Los roles ahora se comparan con los literales del nuevo API (PROPIETARIO, ARRENDATARIO).
     */
    const isPlatformAdmin = appRole === 'SUPERADMIN' || appRole === 'ADMIN';
    const isOwner = hasCompany && currentRole === 'PROPIETARIO' as any;
    const isTenant = hasCompany && currentRole === 'ARRENDATARIO' as any;

    // 1. Acceso Base
    const menu = [
      { 
        label: 'Dashboard', 
        route: '/app/dashboard',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' 
      }
    ];

    // 2. Gestión de Infraestructura (ADMIN)
    if (isPlatformAdmin) {
      menu.push({ 
        label: 'Nueva Empresa', 
        route: '/app/create-company',
        icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' 
      });
    }

    // 3. Gestión Operativa (ADMIN / OWNER)
    if (isPlatformAdmin || isOwner) {
      menu.push(
        { label: 'Inmuebles', route: '/app/properties', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m4 0h1m-5 10h1m4 0h1m-5-4h1m4 0h1' },
        { label: 'Contratos', route: '/app/contracts', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { label: 'Arrendatarios', route: '/app/tenants', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197' },
        { label: 'Impuestos', route: '/app/taxes', icon: 'M9 8l3 5m0 0l3-5m-3 5v4m-3-5h6m-6 3h6m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
      );
    }

    // 4. Gestión de Equipo (Solo OWNER)
    if (isOwner) {
      menu.push({ 
        label: 'Equipo', 
        route: '/app/settings/team', 
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' 
      });
    }

    // 5. Configuración (ADMIN / OWNER)
    if (isPlatformAdmin || isOwner) {
      menu.push({ 
        label: 'Configuración', 
        route: '/app/settings', 
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' 
      });
    }

    // 6. Nivel Arrendatario (TENANT)
    if (isTenant) {
      menu.push(
        { label: 'Mis Contratos', route: '/app/my-contracts', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { label: 'Facturas', route: '/app/my-invoices', icon: 'M9 8l3 5m0 0l3-5m-3 5v4m-3-5h6m-6 3h6m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'Perfil Fiscal', route: '/app/tenants/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
      );
    }

    return menu;
  });

  /**
   * @method logout
   * @description Finaliza la sesión y purga el estado local.
   * @returns {void}
   */
  public logout(): void { 
    this.session.logout(); 
  }

  /**
   * @method changeCompany
   * @description Navega hacia la selección de contexto empresarial.
   * @returns {void}
   */
  public changeCompany(): void { 
    this.router.navigate(['/select-company']); 
  }
}