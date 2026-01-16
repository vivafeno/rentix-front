import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ApiConfiguration } from '../../api/api-configuration';
import { SessionService } from '../../core/services/session.service';

// Importa tus funciones API generadas
import { companyControllerFindOne } from '../../api/fn/companies/company-controller-find-one';
import { companyControllerUpdate } from '../../api/fn/companies/company-controller-update';

@Component({
  selector: 'app-company-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './company-settings.html',
  // styleUrl: './company-settings.component.scss' // Opcional con Tailwind
})
export class CompanySettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);
  private session = inject(SessionService);

  // Estados con Signals
  isLoading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  
  // Formulario Plano
  form = this.fb.group({
    corporateName: ['', [Validators.required, Validators.minLength(3)]],
    taxId: [{ value: '', disabled: true }, Validators.required], // CIF suele ser inmutable
    addressLine1: ['', Validators.required],
    city: ['', Validators.required],
    zipCode: ['', Validators.required],
    countryCode: ['ES', Validators.required],
    email: ['', [Validators.email]],
    phone: ['']
  });

  ngOnInit() {
    // Reaccionamos si cambia el contexto de empresa
    if (this.session.companyId()) {
      this.loadData();
    }
  }

  async loadData() {
    this.isLoading.set(true);
    const companyId = this.session.companyId();

    if (!companyId) return;

    try {
      const res = await firstValueFrom(companyControllerFindOne(this.http, this.config.rootUrl, { id: companyId }));
      const data = (res as any).body || res;

      // Mapeo: Backend -> Formulario
      this.form.patchValue({
        corporateName: data.facturaeParty?.corporateName || data.name,
        taxId: data.facturaeParty?.taxId,
        addressLine1: data.fiscalAddress?.addressLine1,
        city: data.fiscalAddress?.city,
        zipCode: data.fiscalAddress?.postalCode,
        countryCode: data.fiscalAddress?.countryCode,
        // Asumiendo que estos campos existen en tu entidad Company o Address
        // Si no existen, elimínalos del patchValue
        // email: data.email,
        // phone: data.phone
      });

    } catch (err) {
      this.errorMessage.set('No se pudieron cargar los datos de la empresa.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSubmit() {
    if (this.form.invalid) return;
    
    this.isLoading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const formVal = this.form.getRawValue(); // rawValue para incluir disabled fields si hace falta

    try {
      // Reconstrucción: Formulario -> Payload Backend
      // Ajusta esta estructura según tu UpdateCompanyDto
      const payload = {
        facturaeParty: {
          corporateName: formVal.corporateName
        },
        fiscalAddress: {
          addressLine1: formVal.addressLine1,
          city: formVal.city,
          postalCode: formVal.zipCode,
          countryCode: formVal.countryCode
        },
        // email: formVal.email,
        // phone: formVal.phone
      };

      await firstValueFrom(companyControllerUpdate(this.http, this.config.rootUrl, { 
        id: this.session.companyId()!, 
        body: payload as any 
      }));

      this.successMessage.set('Datos de empresa actualizados correctamente.');
      
      // Opcional: Refrescar datos de sesión para actualizar nombre en el header
      // await this.session.refreshSessionData();

    } catch (err: any) {
      console.error(err);
      this.errorMessage.set(err.error?.message || 'Error al guardar los cambios.');
    } finally {
      this.isLoading.set(false);
    }
  }
}