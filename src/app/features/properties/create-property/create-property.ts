import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { SessionService } from '../../../core/services/session.service';
import { ApiConfiguration } from '../../../api/api-configuration';
import { HttpClient } from '@angular/common/http';
import { propertyControllerCreate } from '../../../api/fn/properties/property-controller-create';
import { CreatePropertyDto } from '../../../api/models';

/**
 * Componente de flujo guiado para la creación de activos inmobiliarios.
 * * Estándares Blueprint 2026:
 * - Sincronización estricta con CreatePropertyDto (Backend).
 * - Uso de NonNullableFormBuilder para robustez de tipos.
 * - Mapping de tipos nativos (Number) antes del envío.
 */
@Component({
  selector: 'app-create-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-property.html',
})
export class CreatePropertyComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfiguration);

  public step = signal<number>(1);
  public isSubmitting = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  /**
   * Formulario 100% alineado con los nombres del DTO de NestJS.
   * Cambios: buildYear -> constructionYear | hasPool -> hasStorageRoom.
   */
  public form = this.fb.group({
    location: this.fb.group({
      internalCode: [`PROP-${Date.now()}`, [Validators.required]],
      cadastralReference: ['', [Validators.maxLength(25)]],
      address: this.fb.group({
        addressLine1: ['', [Validators.required]],
        city: ['', [Validators.required]],
        postalCode: ['', [Validators.required]],
        province: ['Valencia', [Validators.required]],
        countryCode: ['ES', [Validators.required]]
      })
    }),
    technical: this.fb.group({
      type: ['RESIDENTIAL', [Validators.required]],
      status: ['AVAILABLE', [Validators.required]],
      surfaceUseful: [0, [Validators.required, Validators.min(1)]],
      surfaceTotal: [0, [Validators.required, Validators.min(1)]],
      bedrooms: [0, [Validators.min(0)]],
      bathrooms: [0, [Validators.min(0)]],
      constructionYear: [new Date().getFullYear(), [Validators.min(1800), Validators.max(2100)]]
    }),
    amenities: this.fb.group({
      hasElevator: [false],
      hasParking: [false],
      hasTerrace: [false],
      hasStorageRoom: [false] // Alineado con el DTO del backend
    })
  });

  get locationGroup() { return this.form.get('location'); }
  get technicalGroup() { return this.form.get('technical'); }

  public next(): void {
    if (this.step() === 1 && this.locationGroup?.valid) {
      this.step.set(2);
    } else if (this.step() === 2 && this.technicalGroup?.valid) {
      this.step.set(3);
    } else {
      this.form.markAllAsTouched();
    }
  }

  public back(): void {
    this.step.update(s => s > 1 ? s - 1 : s);
  }

  /**
   * Envío de datos al Backend.
   * Asegura que el payload sea idéntico a lo que espera la API de NestJS.
   */
  async onSubmit(): Promise<void> {
    this.errorMessage.set(null);
    const currentCompany = this.session.currentCompany();

    if (!currentCompany) {
      this.errorMessage.set('Contexto de organización no detectado.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();

    // Payload alineado estrictamente con el contrato del Backend
    const payload: CreatePropertyDto = {
      internalCode: raw.location.internalCode,
      cadastralReference: raw.location.cadastralReference || undefined,
      type: raw.technical.type as any,
      status: raw.technical.status as any,
      surfaceUseful: Number(raw.technical.surfaceUseful),
      surfaceTotal: Number(raw.technical.surfaceTotal),
      bedrooms: Number(raw.technical.bedrooms),
      bathrooms: Number(raw.technical.bathrooms),
      constructionYear: Number(raw.technical.constructionYear), // Corregido buildYear -> constructionYear

      hasElevator: raw.amenities.hasElevator,
      hasParking: raw.amenities.hasParking,
      hasTerrace: raw.amenities.hasTerrace,
      hasStorageRoom: raw.amenities.hasStorageRoom, // Corregido hasPool -> hasStorageRoom

      address: {
        addressLine1: raw.location.address.addressLine1,
        city: raw.location.address.city,
        postalCode: raw.location.address.postalCode,
        province: raw.location.address.province,
        countryCode: raw.location.address.countryCode,
        type: 'PROPERTY' as any,
        status: 'ACTIVE' as any
      }
    };

    try {
      await firstValueFrom(
        propertyControllerCreate(this.http, this.config.rootUrl, { body: payload })
          .pipe(map(r => r.body))
      );

      this.router.navigate(['/app/properties']);
    } catch (error: any) {
      this.errorMessage.set(error.error?.message || 'Error al registrar activo');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}