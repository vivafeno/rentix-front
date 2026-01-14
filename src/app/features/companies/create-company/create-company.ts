import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ApiConfiguration } from '../../../api/api-configuration';
import { SessionService } from '../../../core/services/session.service';

// --- CONTROLADORES API ---
import { userControllerFindAll } from '../../../api/fn/users/user-controller-find-all';
import { userControllerCreate } from '../../../api/fn/users/user-controller-create';
import { addressControllerCreateDraft } from '../../../api/fn/addresses/address-controller-create-draft';
import { fiscalIdentityControllerCreate } from '../../../api/fn/fiscal-identities/fiscal-identity-controller-create';
import { companyControllerCreate } from '../../../api/fn/companies/company-controller-create';

// --- MODELOS ---
import { User } from '../../../api/models/user';
import { CreateCompanyDto } from '../../../api/models/create-company-dto';

@Component({
  selector: 'app-create-company',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-company.html'
})
export class CreateCompanyComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);
  private router = inject(Router);
  private session = inject(SessionService);

  // Estados de control del Wizard
  currentStep = signal(1);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // IDs recolectados
  selectedUserId = signal<string | null>(null);
  createdAddressId = signal<string | null>(null);
  createdFiscalId = signal<string | null>(null);

  summaryData = signal({ userEmail: '', address: '', taxName: '' });

  // PASO 1: Formulario ajustado al CreateUserDto (Sin nombres para evitar Error 400)
  userMode = signal<'existing' | 'new'>('existing');
  availableUsers = signal<User[]>([]);
  
  newUserForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['Temp1234!', [Validators.required, Validators.minLength(6)]]
  });

  addressForm = this.fb.group({
    addressLine1: ['', Validators.required],
    city: ['', Validators.required],
    zipCode: ['', Validators.required],
    country: ['ES', Validators.required]
  });

  fiscalForm = this.fb.group({
    taxName: ['', [Validators.required, Validators.minLength(3)]],
    taxId: ['', [Validators.required, Validators.minLength(8)]]
  });

  confirmationForm = this.fb.group({
    acceptTerms: [false, Validators.requiredTrue]
  });

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    try {
      const response = await firstValueFrom(userControllerFindAll(this.http, this.config.rootUrl, { take: 1000 }));
      const body = (response as any).body || response;
      this.availableUsers.set(Array.isArray(body) ? body : body.data || []);
    } catch (err) {
      console.error('Error cargando usuarios', err);
    }
  }

  async submitStep1() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      if (this.userMode() === 'existing') {
        if (!this.selectedUserId()) throw new Error('Selecciona un usuario');
        const user = this.availableUsers().find(u => u.id === this.selectedUserId());
        this.summaryData.update(s => ({ ...s, userEmail: user?.email || '' }));
      } else {
        if (this.newUserForm.invalid) return;
        // Payload limpio para el DTO del Backend
        const payload = { 
          email: this.newUserForm.value.email, 
          password: this.newUserForm.value.password,
          appRole: 'USER' 
        };
        const res = await firstValueFrom(userControllerCreate(this.http, this.config.rootUrl, { body: payload as any }));
        const newUser = (res as any).body || res;
        this.selectedUserId.set(newUser.id);
        this.summaryData.update(s => ({ ...s, userEmail: newUser.email }));
      }
      this.currentStep.set(2);
    } catch (err: any) {
      this.errorMessage.set(err.error?.message || 'Error en el Paso 1');
    } finally { this.isLoading.set(false); }
  }

  async submitStep2() {
    if (this.addressForm.invalid) return;
    this.isLoading.set(true);
    try {
      const dto = {
        type: 'FISCAL',
        addressLine1: this.addressForm.value.addressLine1!,
        city: this.addressForm.value.city!,
        postalCode: this.addressForm.value.zipCode!,
        countryCode: this.addressForm.value.country!
      };
      const res = await firstValueFrom(addressControllerCreateDraft(this.http, this.config.rootUrl, { body: dto as any }));
      const body = (res as any).body || res;
      this.createdAddressId.set(body.id);
      this.summaryData.update(s => ({ ...s, address: `${dto.addressLine1}, ${dto.city}` }));
      this.currentStep.set(3);
    } catch (err: any) {
      this.errorMessage.set(err.error?.message || 'Error en el Paso 2');
    } finally { this.isLoading.set(false); }
  }

  async submitStep3() {
    if (this.fiscalForm.invalid) return;
    this.isLoading.set(true);
    try {
      const dto = {
        personType: 'LegalEntity',
        taxIdType: '01',
        corporateName: this.fiscalForm.value.taxName!,
        taxId: this.fiscalForm.value.taxId!
      };
      const res = await firstValueFrom(fiscalIdentityControllerCreate(this.http, this.config.rootUrl, { body: dto as any }));
      const body = (res as any).body || res;
      this.createdFiscalId.set(body.id);
      this.summaryData.update(s => ({ ...s, taxName: dto.corporateName }));
      this.currentStep.set(4);
    } catch (err: any) {
      this.errorMessage.set(err.error?.message || 'Error en el Paso 3');
    } finally { this.isLoading.set(false); }
  }

  async submitStep4() {
    if (this.confirmationForm.invalid) return;
    this.isLoading.set(true);
    try {
      const dto: CreateCompanyDto = {
        userId: this.selectedUserId()!,
        fiscalAddressId: this.createdAddressId()!,
        facturaePartyId: this.createdFiscalId()!
      };
      await firstValueFrom(companyControllerCreate(this.http, this.config.rootUrl, { body: dto }));
      await this.session.refreshSessionData();
      this.router.navigate(['/select-company']);
    } catch (err: any) {
      this.errorMessage.set(err.error?.message || 'Error Final');
    } finally { this.isLoading.set(false); }
  }

  setUserMode(mode: 'existing' | 'new') { this.userMode.set(mode); this.errorMessage.set(null); }
  onUserSelect(event: Event) { this.selectedUserId.set((event.target as HTMLSelectElement).value || null); }
  goBack() { if (this.currentStep() > 1) this.currentStep.update(v => v - 1); }
}