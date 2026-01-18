import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

/** 🛡️ IMPORTACIONES FUNCIONALES */
import { companyControllerCreateOwner } from '../../../api/fn/companies/company-controller-create-owner';
import { userControllerFindAll } from '../../../api/fn/users/user-controller-find-all';
import { userControllerCreate } from '../../../api/fn/users/user-controller-create';

/** 🛡️ MODELOS */
import { User, CreateCompanyLegalDto, CreateUserDto } from '../../../api/models';
import { SessionService } from '../../../core/services/session.service';
import { LegalWizardService } from '../../../core/services/legal-wizard.service';

/**
 * @class CreateCompanyComponent
 * @description Wizard Administrativo de Alta Patrimonial (Blueprint 2026).
 * @version 2.9.5
 */
@Component({
  selector: 'app-create-company',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-company.html'
})
export class CreateCompanyComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  public readonly wizardService = inject(LegalWizardService);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly availableUsers = signal<User[]>([]);
  readonly userMode = signal<'existing' | 'new'>('existing');

  /**
   * @description Definición del Formulario.
   * CORRECCIÓN TS2339: Se añade 'confirmation' para sincronizar con el HTML.
   */
  readonly form = this.fb.group({
    user: this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['Temp1234!', [Validators.required, Validators.minLength(6)]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phone: ['', [Validators.required]]
    }),
    fiscal: this.fb.group({
      corporateName: ['', [Validators.required]],
      taxId: ['', [Validators.required]],
      personType: ['J', Validators.required],
      taxIdType: ['01', Validators.required],
      tradeName: [''],
    }),
    address: this.fb.group({
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      postalCode: ['', Validators.required],
      province: ['', Validators.required],
      countryCode: ['ESP', Validators.required]
    }),
    /** 🛡️ BLOQUE CRÍTICO: Requerido por la línea 130 del HTML */
    confirmation: this.fb.group({
      acceptTerms: [false, Validators.requiredTrue]
    })
  });

  private readonly formValueSignal = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  readonly isSubmitDisabled = computed(() => {
    this.formValueSignal();
    return this.form.invalid || this.isLoading();
  });

  constructor() {
    this.initData();
  }

  /**
   * @method initData
   * @description Carga inicial de usuarios responsables.
   */
  private async initData(): Promise<void> {
    try {
      const fn = userControllerFindAll as any;
      const res = await fn(this.http, { take: 1000 }).toPromise();
      const users = res?.body as User[];
      if (users) {
        this.availableUsers.set(users.filter(u => u.appRole === 'USER'));
      }
    } catch (err) {
      this.errorMessage.set('Error en sincronización de responsables.');
    }
  }

  /**
   * @method submitForm
   * @description Ejecuta la transacción atómica legal.
   */
  public async submitForm(): Promise<void> {
    if (this.isSubmitDisabled()) return;
    this.errorMessage.set(null);
    this.isLoading.set(true);

    try {
      const userId = await this.resolveUserId();
      const payload = this.mapToDto(userId);

      const fn = companyControllerCreateOwner as any;
      const res = await fn(this.http, { body: payload }).toPromise();
      const result = res?.body;

      if (result?.id) {
        this.wizardService.reset();
        await this.session.selectCompany(result.id);
        this.router.navigate(['/app/dashboard']);
      }
    } catch (err: any) {
      const msg = err.error?.message || 'Error en la transacción legal.';
      this.errorMessage.set(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * @method mapToDto
   * @description Mapeo de datos para el contrato OpenAPI.
   */
  private mapToDto(userId: string): CreateCompanyLegalDto {
    const raw = this.form.getRawValue();
    return {
      userId,
      company: { userId },
      address: {
        addressLine1: raw.address.addressLine1!,
        addressLine2: raw.address.addressLine2 || '',
        city: raw.address.city!,
        postalCode: raw.address.postalCode!,
        province: raw.address.province!,
        countryCode: 'ESP',
        type: 'FISCAL' as any
      } as any,
      fiscal: {
        taxId: raw.fiscal.taxId!,
        personType: raw.fiscal.personType as any,
        taxIdType: raw.fiscal.taxIdType as any,
        corporateName: raw.fiscal.corporateName!,
        tradeName: raw.fiscal.tradeName || undefined,
      } as any
    };
  }

  /**
   * @method resolveUserId
   */
  private async resolveUserId(): Promise<string> {
    if (this.userMode() === 'existing') {
      const email = this.form.get('user.email')?.value;
      const user = this.availableUsers().find(u => u.email === email);
      return user?.id || '';
    }

    const userPayload: CreateUserDto = {
      email: this.form.value.user?.email!,
      password: this.form.value.user?.password!,
      firstName: this.form.value.user?.firstName!,
      lastName: this.form.value.user?.lastName!,
      phone: this.form.value.user?.phone!,
      appRole: 'USER' as any
    };

    const fn = userControllerCreate as any;
    const res = await fn(this.http, { body: userPayload }).toPromise();
    const newUser = res?.body as User;
    return newUser.id!;
  }

  public setUserMode(mode: 'existing' | 'new'): void {
    this.userMode.set(mode);
    if (mode === 'new') this.form.get('user')?.reset({ password: 'Temp1234!' });
  }

  public onUserSelect(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    const user = this.availableUsers().find(u => u.id === id);
    if (user) {
      this.form.patchValue({
        user: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone
        }
      });
      this.wizardService.updateSection('company', { userId: id });
    }
  }
}