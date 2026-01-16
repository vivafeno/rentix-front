import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { PropertyService } from '../../../core/services/property.service';
import { Property, UpdatePropertyDto } from '../../../api/models';

/**
 * Componente de formulario para la creación y edición de inmuebles.
 * Gestiona la persistencia de datos incluyendo la entidad anidada Address.
 */
@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './property-form.html'
})
export class PropertyFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly propertyService = inject(PropertyService);

  /** Notifica al componente padre que se ha realizado una persistencia exitosa */
  @Output() saved = new EventEmitter<void>();

  // --- Estado de UI (Signals) ---
  public isOpen = signal(false);
  public isEdit = signal(false);
  public isLoading = signal(false);
  private currentPropertyId = signal<string | null>(null);

  /** Estructura del formulario reactivo alineada con el modelo Property */
  public form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    internalCode: [''],
    type: ['RESIDENTIAL', [Validators.required]],
    surfaceM2: [0],
    status: ['AVAILABLE'],
    address: this.fb.group({
      addressLine1: ['', [Validators.required]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      province: ['Valencia'],
      countryCode: ['ES']
    })
  });

  /**
   * Inicializa el formulario y activa la visibilidad del drawer.
   * @param property Entidad para precarga en modo edición.
   */
  public open(property?: Property): void {
    this.isOpen.set(true);

    if (property) {
      this.isEdit.set(true);
      this.currentPropertyId.set(property.id);

      this.form.patchValue({
        name: property.name,
        internalCode: property.internalCode,
        type: property.type,
        surfaceM2: property.surfaceM2,
        status: property.status,
        address: {
          addressLine1: property.address?.addressLine1,
          city: property.address?.city,
          postalCode: property.address?.postalCode,
          province: property.address?.province || 'Valencia',
          countryCode: property.address?.countryCode || 'ES'
        }
      });
    } else {
      this.isEdit.set(false);
      this.currentPropertyId.set(null);
      this.form.reset({
        type: 'RESIDENTIAL',
        status: 'AVAILABLE',
        address: { province: 'Valencia', countryCode: 'ES' }
      });
    }
  }

  /**
   * Cierra el formulario y resetea el estado interno.
   */
  public close(): void {
    this.isOpen.set(false);
    this.form.reset();
  }

  /**
   * Procesa la validación y persiste los datos en el servidor.
   */
  public async save(): Promise<void> {
    if (this.form.invalid) {
      console.warn('⚠️ Validación fallida:', this.getInvalidControls());
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    try {
      const rawValue = this.form.getRawValue();

      // Mapeo de datos al DTO requerido por NestJS
      const dto: UpdatePropertyDto = {
        ...rawValue,
        surfaceM2: Number(rawValue.surfaceM2),
        address: {
          ...rawValue.address,
          type: 'PROPERTY'
        }
      };

      if (this.isEdit() && this.currentPropertyId()) {
        await this.propertyService.update(this.currentPropertyId()!, dto);
      } else {
        // Implementación futura: this.propertyService.create(dto);
      }

      this.saved.emit();
      this.close();
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Identifica y devuelve los nombres de los controles con errores de validación.
   * Incluye soporte para el grupo anidado de dirección.
   */
  private getInvalidControls(): string[] {
    const invalid: string[] = [];
    
    // Inspección de controles raíz
    Object.keys(this.form.controls).forEach(key => {
      if (this.form.get(key)?.invalid) invalid.push(key);
    });

    // Inspección de controles anidados (Address)
    const addressGroup = this.form.get('address') as FormGroup;
    if (addressGroup) {
      Object.keys(addressGroup.controls).forEach(key => {
        if (addressGroup.get(key)?.invalid) invalid.push(`address.${key}`);
      });
    }

    return invalid;
  }

  /**
   * Gestiona el registro de errores en la capa de UI.
   */
  private handleError(error: any): void {
    console.error('Property Form Error:', error);
  }
}