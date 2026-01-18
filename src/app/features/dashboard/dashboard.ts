import { Component, inject, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { SessionService } from '../../core/services/session.service';
import { ApiService } from '../../core/api/api.service';

/**
 * @description Componente principal de la consola de mando.
 * Proporciona una visión agregada de los activos, ratios de ocupación y volumen de gestión.
 * Utiliza TanStack Query para la sincronización reactiva basada en el contexto de empresa.
 * * @author Rentix 2026 Team
 * @architecture Shell Architecture / Zoneless
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html'
})
export class DashboardComponent {
  /** @description Servicio de comunicación con el API central de Rentix */
  private readonly api = inject(ApiService);
  
  /** @description Servicio de gestión de sesión y contexto patrimonial */
  public readonly session = inject(SessionService);

  // --- QUERIES DE ESTADO ---

  /** * @description Motor de sincronización para el inventario de propiedades.
   * La query es reactiva al signal 'companyId' del SessionService.
   */
  readonly propertiesQuery = injectQuery(() => ({
    queryKey: ['properties', this.session.companyId()],
    queryFn: () => this.api.get<any[]>(`/properties?companyId=${this.session.companyId()}`),
    enabled: !!this.session.companyId(),
  }));

  // --- SIGNALS DERIVADOS (CÓMPUTO DE NEGOCIO) ---

  /** * @description Lista aplanada de propiedades obtenida de la caché de TanStack.
   * @returns {Signal<any[]>} Array de objetos de propiedad o array vacío.
   */
  readonly properties = computed(() => this.propertiesQuery.data() || []);
  
  /** * @description Cantidad total de activos bajo gestión en la empresa seleccionada.
   * @returns {Signal<number>} Conteo total.
   */
  readonly totalUnits = computed(() => this.properties().length);
  
  /** * @description Conteo de activos con estado 'AVAILABLE'.
   * @returns {Signal<number>} Número de vacantes.
   */
  readonly availableUnits = computed(() => 
    this.properties().filter(p => p.status === 'AVAILABLE').length
  );

  /** * @description Porcentaje de activos en estado 'RENTED' sobre el total.
   * @returns {Signal<number>} Valor entre 0 y 100.
   */
  readonly occupancyRate = computed(() => {
    if (this.totalUnits() === 0) return 0;
    const rented = this.properties().filter(p => p.status === 'RENTED').length;
    return Math.round((rented / this.totalUnits()) * 100);
  });

  /** * @description Sumatorio de metros cuadrados construidos de todos los activos.
   * @returns {Signal<number>} Superficie total gestionada.
   */
  readonly totalSurface = computed(() => 
    this.properties().reduce((acc, p) => acc + (p.surfaceM2 || 0), 0)
  );

  /**
   * @constructor
   * @description El componente inicializa las queries de forma declarativa mediante TanStack.
   */
  constructor() {}
}