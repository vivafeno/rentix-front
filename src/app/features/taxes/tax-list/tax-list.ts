import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TaxService } from '../../../core/services/tax.service';
import { Tax } from '../../../api/models';

/**
 * Componente de gestión de impuestos con soporte para ciclo de vida de papelera.
 * * * Estándares Blueprint 2026:
 * - **Reactividad**: Uso de Signals para estado local y Computed para proyecciones de datos.
 * - **Integridad**: Filtros excluyentes basados en `deletedAt` para evitar colisiones entre vistas.
 * - **Eficiencia**: Actualización optimista de la UI tras acciones de borrado/restauración.
 * * @version 2026.1.4
 * @author Rentix
 */
@Component({
  selector: 'app-tax-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tax-list.html',
  styleUrl: './tax-list.scss',
})
export class TaxListComponent implements OnInit {
  private readonly taxService = inject(TaxService);
  private readonly router = inject(Router);

  // --- Estado de la UI (Signals) ---
  
  /** Fuente de datos cruda proveniente de la API */
  public taxes = signal<Tax[]>([]);
  
  /** Indicador de estado de carga para feedback visual */
  public isLoading = signal<boolean>(false);
  
  /** Tab activa para conmutar entre el catálogo operativo y la papelera */
  public activeTab = signal<'active' | 'trash'>('active');

  // --- Selectors Derivados (Computed Signals) ---
  
  /** * Filtra los impuestos indirectos (IVA/IGIC) que no han sido borrados.
   * Discriminador: t.deletedAt === null
   */
  public vats = computed(() => 
    this.taxes().filter(t => (t.tipo === 'IVA' || t.tipo === 'IGIC') && !t.deletedAt)
  );
  
  /** * Filtra las retenciones impositivas activas.
   * Discriminador: t.deletedAt === null
   */
  public retentions = computed(() => 
    this.taxes().filter(t => t.tipo === 'IRPF' && !t.deletedAt)
  );

  /** * Proyecta los elementos que residen en la papelera de reciclaje.
   * Discriminador: t.deletedAt !== null
   */
  public trashItems = computed(() => 
    this.taxes().filter(t => t.deletedAt !== null)
  );

  /**
   * Inicializa el componente solicitando los datos del catálogo activo.
   */
  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Recupera los datos desde el servicio de fachada según el contexto de la pestaña.
   * @returns Promise<void>
   */
  public async loadData(): Promise<void> {
    this.isLoading.set(true);
    try {
      // Invocamos el endpoint correspondiente según el estado de activeTab
      const data = this.activeTab() === 'active' 
        ? await this.taxService.findAll() 
        : await this.taxService.findAllDeleted();
      
      this.taxes.set(data);
    } catch (error: unknown) {
      this.handleError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Cambia el contexto de visualización y refresca los datos.
   * @param tab Identificador de la pestaña destino ('active' | 'trash').
   */
  public async toggleTab(tab: 'active' | 'trash'): Promise<void> {
    this.activeTab.set(tab);
    await this.loadData();
  }

  /**
   * Ejecuta el borrado lógico (Soft Delete) de un impuesto.
   * Actualiza el estado local de forma optimista para mejorar la latencia percibida.
   * @param id UUID del impuesto a eliminar.
   */
  public async remove(id: string): Promise<void> {
    const confirmed = confirm('¿Mover este impuesto a la papelera? Dejará de estar disponible para nuevos documentos.');
    if (!confirmed) return;

    try {
      await this.taxService.remove(id);
      // Blueprint 2026: Actualización reactiva sin recarga de página
      this.taxes.update(prev => prev.filter(t => t.id !== id));
    } catch (error: unknown) {
      this.handleError(error);
    }
  }

  /**
   * Restaura un elemento de la papelera devolviéndolo al catálogo activo.
   * @param id UUID del impuesto a restaurar.
   */
  public async restore(id: string): Promise<void> {
    try {
      await this.taxService.restore(id);
      // Eliminamos el elemento de la lista actual (vista papelera)
      this.taxes.update(prev => prev.filter(t => t.id !== id));
    } catch (error: unknown) {
      this.handleError(error);
    }
  }

  /**
   * Navegación programática hacia el formulario de creación.
   */
  public goToCreate(): void { 
    this.router.navigate(['/app/taxes/new']); 
  }

  /**
   * Navegación programática hacia el formulario de edición.
   * @param id UUID del registro.
   */
  public goToEdit(id: string): void { 
    this.router.navigate(['/app/taxes/edit', id]); 
  }

  /**
   * Gestión centralizada de excepciones con estrechamiento de tipos.
   * @param error Objeto de error capturado.
   */
  private handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Error en la operación de impuestos';
    console.error(`[TaxList Error (${this.activeTab()})]:`, message);
    // TODO: Integrar con ToastService/NotificationService para feedback de usuario
  }
}