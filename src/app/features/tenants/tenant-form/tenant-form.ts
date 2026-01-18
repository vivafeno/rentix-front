import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { User } from '../../../api/models';
import { TenantService } from '../../../core/services/tenant.service';
import { UserSelectorComponent } from '../../../shared/components/user-selector/user-selector';

/**
 * @description Orquestador de Alta/Edición de Inquilinos (Tenant).
 * Gestiona el flujo atómico: Identificación de Usuario -> Hidratación Fiscal -> Persistencia.
 * @author Gemini Blueprint 2026
 * @version 1.2.0
 */
@Component({
  selector: 'app-tenant-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    UserSelectorComponent 
  ],
  templateUrl: './tenant-form.html',
  styleUrls: ['./tenant-form.scss']
})
export class TenantFormComponent implements OnInit {
  private readonly _fb = inject(FormBuilder);
  private readonly _tenantService = inject(TenantService);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);

  /** @description Control del Wizard: 'selecting' para búsqueda de User, 'filling' para datos fiscales. */
  readonly step = signal<'selecting' | 'filling'>('selecting');
  
  /** @description Estado de carga durante la comunicación con el API. */
  readonly isSaving = signal<boolean>(false);
  
  /** @description Referencia tipada del usuario seleccionado para el alta del Tenant. */
  readonly selectedUser = signal<User | null>(null);
  
  /** @description Almacena el ID en modo edición para discriminar entre POST/PUT. */
  readonly tenantId = signal<string | null>(null);

  /** * @description Formulario reactivo para la entidad Tenant.
   * La estructura refleja el contrato de persistencia del backend.
   */
  readonly tenantForm: FormGroup = this._fb.group({
    userId: ['', [Validators.required]],
    internalCode: ['', [Validators.required, Validators.maxLength(20)]],
    profile: this._fb.group({
      legalName: ['', [Validators.required]],
      taxId: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    })
  });

  /**
   * @description Ciclo de vida: Detección de parámetros de ruta para modo edición.
   */
  ngOnInit(): void {
    const id = this._route.snapshot.paramMap.get('id');
    if (id) {
      this.tenantId.set(id);
      this._loadTenantData(id);
    }
  }

  /**
   * @description Procesa el usuario emitido por el selector.
   * Realiza la hidratación inicial del perfil fiscal basada en los datos del usuario.
   * @param {User | any} user - Entidad de usuario. Se usa any para prevenir errores de casteo en template.
   */
  public onUserSelected(user: User | any): void {
    // Coerción de seguridad para garantizar que el objeto cumple el contrato User
    const userData = user as User;
    if (!userData?.id) return;

    this.selectedUser.set(userData);
    
    // Hidratación atómica: Mapeamos datos de cuenta a perfil fiscal
    this.tenantForm.patchValue({ 
      userId: userData.id,
      profile: { 
        email: userData.email,
        legalName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() 
      } 
    });
    
    this.step.set('filling');
  }

  /**
   * @description Envía el payload al servicio de persistencia.
   * Implementa validación previa y control de estado isSaving.
   * @returns {Promise<void>}
   */
  public async onSubmit(): Promise<void> {
    if (this.tenantForm.invalid || this.isSaving()) {
      this.tenantForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    
    try {
      const payload = this.tenantForm.getRawValue();
      
      if (this.tenantId()) {
        await this._tenantService.update(this.tenantId()!, payload);
      } else {
        await this._tenantService.create(payload);
      }
      
      this._router.navigate(['/app/tenants']);
    } catch (error) {
      // El error se gestionará globalmente, aquí solo se restaura el estado operativo
      console.error('[TenantForm]: Error en persistencia de inquilino', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  /** @description Cancela la operación y retorna al listado principal. */
  public onCancel(): void {
    this._router.navigate(['/app/tenants']);
  }

  /**
   * @description Carga y sincroniza los datos de un inquilino existente.
   * @param {string} id - UUID del Tenant.
   */
  private async _loadTenantData(id: string): Promise<void> {
    try {
      const data = await this._tenantService.findOne(id);
      this.tenantForm.patchValue(data);
      // En edición, saltamos directamente al paso de edición de datos
      this.step.set('filling');
    } catch (error) {
      this.onCancel();
    }
  }
}