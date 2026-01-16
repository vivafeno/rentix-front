import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { SessionService } from '../../../core/services/session.service';
import { ApiConfiguration } from '../../../api/api-configuration';
import { propertyControllerCreate } from '../../../api/fn/properties/property-controller-create';

@Component({
  selector: 'app-create-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-property.html',
})
export class CreatePropertyComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private session = inject(SessionService);
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);

  // --- ESTADO ---
  step = signal<number>(1);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // --- FORMULARIO (Sincronizado con nombres reales del api-json) ---
  form = this.fb.group({
    location: this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]], // Antes 'alias'
      internalCode: [`PROP-${Date.now()}`, Validators.required],  // Obligatorio en tu JSON
      address: this.fb.group({
        addressLine1: ['', Validators.required], // Antes 'street'
        city: ['', Validators.required],
        postalCode: ['', [Validators.required]], // Antes 'zipCode'
        province: ['', Validators.required],
        countryCode: ['ES', Validators.required] // Antes 'country'
      })
    }),
    details: this.fb.group({
      type: ['RESIDENTIAL', Validators.required], // Enum real: RESIDENTIAL, COMMERCIAL...
      surfaceM2: [null as number | null, [Validators.required, Validators.min(1)]], // Antes 'surface'
      cadastralReference: ['', [Validators.maxLength(20)]]
    })
  });

  // --- GETTERS ---
  get locationGroup() { return this.form.get('location'); }
  get detailsGroup() { return this.form.get('details'); }

  // --- NAVEGACIÓN ---
  next() {
    if (this.step() === 1) {
      if (this.locationGroup?.valid) {
        this.step.set(2);
      } else {
        this.locationGroup?.markAllAsTouched();
      }
    }
  }

  back() {
    this.step.set(1);
  }

  closeError() {
    this.errorMessage.set(null);
  }

  // --- SUBMIT ---
async onSubmit() {
  this.errorMessage.set(null);
  const currentCompany = this.session.currentCompany();

  if (!currentCompany) {
    this.errorMessage.set('Selecciona una empresa primero.');
    return;
  }

  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  this.isSubmitting.set(true);
  const rawValue = this.form.getRawValue();

  // 1. ELIMINAMOS companyId del payload (el backend no lo quiere aquí)
  const payload = {
    name: rawValue.location.name,
    internalCode: rawValue.location.internalCode,
    type: rawValue.details.type,
    surfaceM2: Number(rawValue.details.surfaceM2),
    cadastralReference: rawValue.details.cadastralReference || '',
    address: {
      addressLine1: rawValue.location.address.addressLine1,
      city: rawValue.location.address.city,
      postalCode: rawValue.location.address.postalCode,
      province: rawValue.location.address.province,
      countryCode: rawValue.location.address.countryCode,
      type: 'PROPERTY',
      status: 'ACTIVE',
      isDefault: true
    }
  };

  try {
    // 2. ENVIAMOS EL ID POR HEADER (Contexto)
    // El nombre del header suele ser 'x-company-id' o similar según tu Backend
    await firstValueFrom(this.http.post(`${this.config.rootUrl}/properties`, payload, {
      headers: {
        'x-company-id': currentCompany.companyId || (currentCompany as any).companyId
      }
    }));

    this.router.navigate(['/app/properties']);
  } catch (error: any) {
    console.error('❌ Error:', error);
    this.errorMessage.set(error.error?.message || 'Error al crear la propiedad');
  } finally {
    this.isSubmitting.set(false);
  }
}
}