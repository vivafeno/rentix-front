import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { PropertyService } from '../../../core/services/property.service';
import { Property, CreatePropertyDto, UpdatePropertyDto } from '../../../api/models';

/**
 * Slider lateral para la gestión integral de activos inmobiliarios.
 * Incluye todos los campos definidos en el DTO del backend.
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

  public isOpen = signal(false);
  public isEdit = signal(false);
  public isLoading = signal(false);
  private currentPropertyId = signal<string | null>(null);

  /**
   * Inicialización del formulario con el 100% de campos del DTO.
   */
  public form: FormGroup = this.fb.group({
    internalCode: ['', [Validators.required]],
    type: ['RESIDENTIAL', [Validators.required]],
    status: ['AVAILABLE', [Validators.required]],
    cadastralReference: ['', [Validators.maxLength(25)]],
    surfaceTotal: [0, [Validators.required, Validators.min(1)]],
    surfaceUseful: [0, [Validators.required, Validators.min(1)]],
    bedrooms: [0, [Validators.min(0)]],
    bathrooms: [0, [Validators.min(0)]],
    constructionYear: [new Date().getFullYear(), [Validators.min(1800), Validators.max(2100)]],
    orientation: [''],
    energyRating: ['', [Validators.maxLength(1)]],
    energyScore: [0],
    hasElevator: [false],
    hasParking: [false],
    hasTerrace: [false],
    hasStorageRoom: [false],
    description: [''],
    address: this.fb.group({
      addressLine1: ['', [Validators.required]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      province: ['Valencia'],
      countryCode: ['ES']
    })
  });

  public open(property?: Property): void {
    this.isOpen.set(true);
    if (property) {
      this.isEdit.set(true);
      this.currentPropertyId.set(property.id);
      this.form.patchValue({
        ...property,
        constructionYear: (property as any).constructionYear || (property as any).buildYear,
        address: { ...property.address }
      });
    } else {
      this.isEdit.set(false);
      this.currentPropertyId.set(null);
      this.form.reset({ 
        type: 'RESIDENTIAL', status: 'AVAILABLE', 
        constructionYear: new Date().getFullYear(),
        address: { province: 'Valencia', countryCode: 'ES' }
      });
    }
  }

  public close(): void {
    this.isOpen.set(false);
    this.form.reset();
  }

  /**
   * Persistencia total.
   */
  public async save(): Promise<void> {
    console.log('Validando formulario...', this.form.value);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    try {
      const raw = this.form.getRawValue();
      const payload: CreatePropertyDto = {
        ...raw,
        surfaceTotal: Number(raw.surfaceTotal),
        surfaceUseful: Number(raw.surfaceUseful),
        bedrooms: Number(raw.bedrooms),
        bathrooms: Number(raw.bathrooms),
        constructionYear: Number(raw.constructionYear),
        energyScore: Number(raw.energyScore),
        address: { ...raw.address, type: 'PROPERTY' as any, status: 'ACTIVE' as any }
      };

      if (this.isEdit() && this.currentPropertyId()) {
        await this.propertyService.update(this.currentPropertyId()!, payload as UpdatePropertyDto);
      } else {
        await this.propertyService.create(payload);
      }

      this.saved.emit();
      this.close();
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}