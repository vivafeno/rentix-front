import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TenantService } from '../../../core/services/tenant.service';
import { Tenant } from '../../../api/models';

/**
 * @description Vista de gestión y listado de Arrendatarios (Tenants).
 * Implementa arquitectura de fachada sobre servicios funcionales de OpenAPI.
 * * Estándares Blueprint 2026:
 * - Gestión de estados mediante Signals (Fina reactividad).
 * - Navegación programática para flujos de Wizard.
 * - Operaciones asíncronas basadas en Promises.
 * * @author Rentix
 * @version 2026.1.17
 */
@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tenant-list.html',
  styleUrls: ['./tenant-list.scss']
})
export class TenantListComponent implements OnInit {
  private readonly _tenantService = inject(TenantService);
  private readonly _router = inject(Router);

  /** @description Control de pestaña activa para filtrado visual */
  public activeTab = signal<'active' | 'trash'>('active');

  /** @description Listado maestro de arrendatarios */
  public tenants = signal<Tenant[]>([]);
  
  /** @description Estado de carga sincronizado con el spinner del HTML */
  public isLoading = signal<boolean>(false);

  /** * @description Conteo reactivo de elementos en papelera.
   * Derivado automáticamente del estado de tenants.
   */
  public trashCount = computed(() => {
    const list = this.tenants();
    return Array.isArray(list) ? list.filter(t => t.status === 'INACTIVE').length : 0;
  });

  /**
   * @description Inicialización: Carga inicial del catálogo.
   */
  ngOnInit(): void {
    this.loadTenants();
  }

  /**
   * @description Recupera los arrendatarios vinculados a la empresa activa.
   * Maneja la limpieza de tipos para evitar errores de filtrado en Signals.
   */
  public async loadTenants(): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await this._tenantService.findAll();
      // Aseguramos que data sea siempre un array para evitar errores en el computed
      this.tenants.set(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[TenantList Error]: Error al sincronizar datos', error);
      this.tenants.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * @description Navega al formulario de creación (Wizard de Arrendatario).
   */
  public onNewTenant(): void {
    this._router.navigate(['/app/tenants/new']);
  }

  /**
   * @description Navega al modo edición del perfil seleccionado.
   * @param id Identificador UUID del Tenant.
   */
  public onEdit(id: string): void {
    this._router.navigate(['/app/tenants/edit', id]);
  }

  /**
   * @description Ejecuta el borrado lógico (movimiento a papelera).
   * @param id Identificador UUID del Tenant.
   */
  public async onDelete(id: string): Promise<void> {
    if (!confirm('¿Desea mover este arrendatario a la papelera?')) return;
    
    try {
      await this._tenantService.remove(id);
      // Actualización optimista del estado local
      this.tenants.update(current => current.filter(t => t.id !== id));
    } catch (error) {
      console.error('[TenantList Error]: Error en la operación de borrado', error);
    }
  }

  /**
   * @description Restaura un registro de la papelera al estado activo.
   * @param id Identificador UUID del Tenant.
   */
  public async onRestore(id: string): Promise<void> {
    console.log('[TenantList]: Restaurando registro', id);
    // Implementar llamada a this._tenantService.restore(id) cuando esté disponible en el API
  }
}