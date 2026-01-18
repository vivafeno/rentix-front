import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

/** Imports estandarizados */
import { User } from '../../../api/models';
import { TenantService } from '../../../core/services/tenant.service';
import { UserSelectorComponent } from '../../../shared/components/user-selector/user-selector';

@Component({
  selector: 'app-tenant-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    UserSelectorComponent // <--- Registramos el componente atómico
  ],
  templateUrl: './tenant-form.html',
  styleUrls: ['./tenant-form.scss']
})
export class TenantFormComponent implements OnInit {
  private readonly _fb = inject(FormBuilder);
  private readonly _tenantService = inject(TenantService);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);

  public step = signal<'selecting' | 'filling'>('selecting');
  public isSaving = signal<boolean>(false);
  public selectedUser = signal<Partial<User> | null>(null);
  public tenantId = signal<string | null>(null);

  public tenantForm: FormGroup = this._fb.group({
    userId: ['', [Validators.required]],
    internalCode: ['', [Validators.required, Validators.maxLength(20)]],
    profile: this._fb.group({
      legalName: ['', [Validators.required]],
      taxId: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    })
  });

  ngOnInit(): void {
    const id = this._route.snapshot.paramMap.get('id');
    if (id) {
      this.tenantId.set(id);
      this._loadTenantData(id);
    }
  }

  /**
   * @description Maneja el usuario emitido por el UserSelector (vía búsqueda o creación).
   */
  public onUserSelected(user: User): void {
    this.selectedUser.set(user);
    this.tenantForm.patchValue({ 
      userId: user.id,
      profile: { email: user.email } 
    });
    this.step.set('filling');
  }

  public async onSubmit(): Promise<void> {
    if (this.tenantForm.invalid) return;
    this.isSaving.set(true);
    try {
      const payload = this.tenantForm.value;
      if (this.tenantId()) {
        await this._tenantService.update(this.tenantId()!, payload);
      } else {
        await this._tenantService.create(payload);
      }
      this._router.navigate(['/app/tenants']);
    } catch (error) {
      console.error('[TenantForm]: Error persistencia', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  public onCancel(): void {
    this._router.navigate(['/app/tenants']);
  }

  private async _loadTenantData(id: string): Promise<void> {
    try {
      const data = await this._tenantService.findOne(id);
      this.tenantForm.patchValue(data);
      this.step.set('filling');
    } catch (error) {
      this.onCancel();
    }
  }
}