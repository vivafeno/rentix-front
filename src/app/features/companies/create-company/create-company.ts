import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/api/api.service';
import { SessionService } from '../../../core/services/session.service';
import { LegalWizardService } from '../../../core/services/legal-wizard.service';

// Modelos del Contrato OpenAPI
import { User, CreateCompanyLegalDto } from '../../../api/models';

/**
 * @description Wizard de Alta de Patrimonio (Blueprint 2026).
 * Implementa creación atómica (User + Company + Address + Fiscal) en una única transacción.
 * Arquitectura Zoneless y comunicación vía Fetch nativo.
 */
@Component({
  selector: 'app-create-company',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-company.html'
})
export class CreateCompanyComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  public readonly wizardService = inject(LegalWizardService);

  // --- SIGNALS DE ESTADO ---
  readonly currentStep = signal<number>(1);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly availableUsers = signal<User[]>([]);
  readonly userMode = signal<'existing' | 'new'>('existing');

  // --- FORMULARIOS REACTIVOS ---
  readonly newUserForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['Temp1234!', [Validators.required, Validators.minLength(6)]]
  });

  readonly addressForm = this.fb.group({
    addressLine1: ['', Validators.required],
    city: ['', Validators.required],
    zipCode: ['', Validators.required],
    country: ['ES', Validators.required]
  });

  readonly fiscalForm = this.fb.group({
    taxName: ['', [Validators.required, Validators.minLength(3)]],
    taxId: ['', [Validators.required, Validators.minLength(8)]]
  });

  readonly confirmationForm = this.fb.group({
    acceptTerms: [false, Validators.requiredTrue]
  });

  constructor() {
    this.loadUsers();
  }

/**
 * @description Carga usuarios con rol USER.
 * Ajustado a la firma del ApiService (1 solo argumento para GET con query params en string).
 */
private async loadUsers(): Promise<void> {
  try {
    // Usamos Template Strings para los parámetros de búsqueda
    const users = await this.api.get<User[]>('/users?take=1000');
    this.availableUsers.set(users.filter(u => u.appRole === 'USER'));
  } catch (err) {
    this.errorMessage.set('Error al sincronizar lista de responsables.');
  }
}

  /**
   * @description PASO 1: Identificación o creación del usuario responsable.
   */
  async submitStep1(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      let finalUserId: string;

      if (this.userMode() === 'existing') {
        finalUserId = this.wizardService.wizardData().company?.userId || '';
        if (!finalUserId) throw new Error('Selecciona un responsable.');
      } else {
        if (this.newUserForm.invalid) throw new Error('Datos de usuario incompletos.');
        const newUser = await this.api.post<User>('/users', { 
          ...this.newUserForm.value, 
          appRole: 'USER' 
        });
        finalUserId = newUser.id!;
      }

      this.wizardService.updateSection('company', { userId: finalUserId });
      this.currentStep.set(2);
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error en identificación.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /** @description PASO 2: Datos de ubicación física. */
  submitStep2(): void {
    if (this.addressForm.invalid) return;
    
    this.wizardService.updateSection('address', {
      addressLine1: this.addressForm.value.addressLine1!,
      city: this.addressForm.value.city!,
      postalCode: this.addressForm.value.zipCode!,
      countryCode: 'ESP',
      type: 'FISCAL',
      isDefault: true
    });
    this.currentStep.set(3);
  }

  /** @description PASO 3: Datos legales y fiscales. */
  submitStep3(): void {
    if (this.fiscalForm.invalid) return;

    this.wizardService.updateSection('fiscal', {
      corporateName: this.fiscalForm.value.taxName!,
      taxId: this.fiscalForm.value.taxId!,
      personType: 'J',
      taxIdType: '01'
    });
    this.currentStep.set(4);
  }

  /**
   * @description PASO 4: Ejecución atómica de la transacción.
   * Blueprint 2026: Todo o nada. Si falla la creación de la dirección, no se crea la empresa.
   */
  async submitStep4(): Promise<void> {
    if (this.confirmationForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const draft = this.wizardService.wizardData();
      const finalUserId = draft.company?.userId;

      const payload: CreateCompanyLegalDto = {
        userId: finalUserId!,
        company: { userId: finalUserId } as any,
        address: { ...draft.address, countryCode: 'ESP' } as any,
        fiscal: { ...draft.fiscal, countryCode: 'ESP' } as any
      };

      // 1. Llamada atómica al backend
      const result = await this.api.post<{ id: string }>('/companies/owner', payload);

      // 2. Limpieza de wizard y cambio de contexto
      this.wizardService.reset();
      
      // 🚩 IMPORTANTE: Usamos selectCompany para obtener el nuevo JWT con los permisos de la nueva empresa
      await this.session.selectCompany(result.id);

    } catch (err: any) {
      const msg = err.error?.message || 'Error en la transacción legal.';
      this.errorMessage.set(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  // --- MÉTODOS AUXILIARES ---

  setUserMode(mode: 'existing' | 'new'): void {
    this.userMode.set(mode);
  }

  onUserSelect(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.wizardService.updateSection('company', { userId: id });
  }

  goBack(): void {
    if (this.currentStep() > 1) this.currentStep.update(v => v - 1);
  }
}