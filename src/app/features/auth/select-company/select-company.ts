import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';

/**
 * @description Selector de contexto patrimonial (Blueprint 2026).
 * Permite al usuario elegir entre sus roles de empresa o registrar uno nuevo.
 * Implementa arquitectura Zoneless y lógica reactiva mediante Signals.
 */
@Component({
  selector: 'app-select-company',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-company.html'
})
export class SelectCompanyComponent {
  public readonly session = inject(SessionService); 
  private readonly router = inject(Router);

  /** @description Signal derivado para identificar privilegios de administración global */
  readonly isSuperAdmin = computed(() => this.session.user()?.appRole === 'SUPERADMIN');

  /**
   * @description Establece la empresa activa y redirige al dashboard operativo.
   * @param companyId Identificador único del patrimonio/empresa
   */
  async onSelect(companyId: string): Promise<void> {
    await this.session.selectCompany(companyId); 
  }
  
  /**
   * @description Redirige al flujo de alta de nuevo patrimonio.
   */
  async goToCreateCompany(): Promise<void> {
    await this.router.navigate(['/create-company']); 
  }
  
  /**
   * @description Finaliza la sesión actual y limpia el almacenamiento.
   */
  logout(): void {
    this.session.logout();
  }
}