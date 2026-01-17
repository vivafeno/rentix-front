import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { PropertyService } from '../../../core/services/property.service';
import { Property, UpdatePropertyDto } from '../../../api/models';

/**
 * Componente de formulario tipo Drawer para la gestión integral de activos.
 * Implementa persistencia atómica y validación estricta según estándares 2026.
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

  @Output() saved = new EventEmitter<void>();

  // --- Estado de UI (Signals) ---
  public isOpen = signal(false);
  public isEdit = signal(false);
  public isLoading = signal(false);
  private currentPropertyId = signal<string | null>(null);

  /**
   * Definición del Formulario Reactivo.
   * Incluye campos técnicos, económicos y de registro catastral.
   */
  public form: FormGroup = this.fb.group({
    // Información Básica
    name: ['', [Validators.required, Validators.minLength(3)]],
    internalCode: ['', [Validators.required]],
    cadastralReference: [''],
    type: ['RESIDENTIAL', [Validators.required]],
    status: ['AVAILABLE', [Validators.required]],
    
    // Datos Económicos y Técnicos
    rentPrice: [null, [Validators.min(0)]],
    surfaceM2: [null, [Validators.min(0)]],
    rooms: [null, [Validators.min(0)]],
    bathrooms: [null, [Validators.min(0)]],
    floor: [''],
    description: [''],

    // Localización (Entidad Anidada)
    address: this.fb.group({
      addressLine1: ['', [Validators.required]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      province: ['Valencia'],
      countryCode: ['ES']
    })
  });

  /**
   * Inicializa el estado del formulario.
   * @param property Datos del activo para edición.
   */
  public open(property?: Property): void {
    this.isOpen.set(true);

    if (property) {
      this.isEdit.set(true);
      this.currentPropertyId.set(property.id);

      this.form.patchValue({
        name: property.name,
        internalCode: property.internalCode,
        cadastralReference: property.cadastralReference,
        type: property.type,
        status: property.status,
        rentPrice: property.rentPrice,
        surfaceM2: property.surfaceM2,
        rooms: property.rooms,
        bathrooms: property.bathrooms,
        floor: property.floor,
        description: property.description,
        address: {
          addressLine1: property.address?.addressLine1 || '',
          city: property.address?.city || '',
          postalCode: property.address?.postalCode || '',
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

  public close(): void {
    this.isOpen.set(false);
    this.form.reset();
  }

  /**
   * Procesa la persistencia de datos.
   * Realiza el Type Casting necesario para la API de NestJS.
   */
  public async save(): Promise<void> {
    if (this.form.invalid) {
      console.warn('⚠️ Errores de validación detectados:', this.getInvalidControls());
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    try {
      const rawValue = this.form.getRawValue();

      // Mapeo exhaustivo al DTO
      const dto: UpdatePropertyDto = {
        name: rawValue.name,
        internalCode: rawValue.internalCode,
        cadastralReference: rawValue.cadastralReference,
        type: rawValue.type,
        status: rawValue.status,
        rentPrice: rawValue.rentPrice ? Number(rawValue.rentPrice) : undefined,
        surfaceM2: rawValue.surfaceM2 ? Number(rawValue.surfaceM2) : undefined,
        rooms: rawValue.rooms ? Number(rawValue.rooms) : undefined,
        bathrooms: rawValue.bathrooms ? Number(rawValue.bathrooms) : undefined,
        floor: rawValue.floor,
        description: rawValue.description,
        address: {
          ...rawValue.address,
          type: 'PROPERTY'
        }
      };

      if (this.isEdit() && this.currentPropertyId()) {
        await this.propertyService.update(this.currentPropertyId()!, dto);
      } else {
        // En una fase posterior activaremos el create:
        // await this.propertyService.create(dto);
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
   * Inspección recursiva de controles inválidos para depuración técnica.
   */
  private getInvalidControls(): string[] {
    const invalid: string[] = [];
    const checkControls = (group: FormGroup, prefix = '') => {
      Object.keys(group.controls).forEach(key => {
        const control = group.get(key);
        if (control instanceof FormGroup) {
          checkControls(control, `${key}.`);
        } else if (control?.invalid) {
          invalid.push(`${prefix}${key}`);
        }
      });
    };
    checkControls(this.form);
    return invalid;
  }

  private handleError(error: any): void {
    console.error('Property Persistence Failure:', error);
  }
}