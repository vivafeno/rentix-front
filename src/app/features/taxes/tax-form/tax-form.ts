import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TaxService } from '../../../core/services/tax.service';
import { CreateTaxDto, TaxType, UpdateTaxDto } from '../../../api/models';

/**
 * Componente de formulario para la gestión (creación/edición) de tipos impositivos.
 * * Estándares Blueprint 2026:
 * - Uso de Signals para control de flujo y estados de carga.
 * - Carga individual mediante findOne para edición.
 * - Persistencia mediante métodos dedicados (create/update).
 * * @version 2026.1.2
 * @author Rentix
 */
@Component({
  selector: 'app-tax-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './tax-form.html',
  styleUrl: './tax-form.scss',
})
export class TaxFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly taxService = inject(TaxService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // --- Estado ---
  public isLoading = signal<boolean>(false);
  public isEditMode = signal<boolean>(false);
  public taxId = signal<string | null>(null);

  /** * Formulario reactivo con validaciones estrictas.
   */
  public taxForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    rate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    type: ['VAT' as TaxType, [Validators.required]],
    isRetention: [false],
    facturaeCode: ['01', [Validators.required]]
  });

  ngOnInit(): void {
    this.checkEditMode();
  }

  /**
   * Determina si estamos en modo edición basándose en la presencia del ID en la URL.
   */
  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.taxId.set(id);
      this.loadTaxData(id);
    }
  }

  /**
   * Carga los datos del impuesto desde el backend usando el nuevo findOne.
   * @param id UUID del impuesto a recuperar.
   */
  private async loadTaxData(id: string): Promise<void> {
    this.isLoading.set(true);
    try {
      // Blueprint 2026: Uso de findOne para obtener la entidad específica
      const tax = await this.taxService.findOne(id);
      
      if (tax) {
        this.taxForm.patchValue(tax);
      }
    } catch (error) {
      this.handleError(error);
      this.router.navigate(['/app/taxes']);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Procesa la persistencia del impuesto (Creación o Actualización).
   */
  public async onSubmit(): Promise<void> {
    if (this.taxForm.invalid) {
      this.taxForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    try {
      if (this.isEditMode() && this.taxId()) {
        // Blueprint 2026: Implementación de actualización parcial
        const updateDto: UpdateTaxDto = this.taxForm.value;
        await this.taxService.update(this.taxId()!, updateDto); 
      } else {
        const createDto: CreateTaxDto = this.taxForm.value;
        await this.taxService.create(createDto);
      }
      this.router.navigate(['/app/taxes']);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Manejo centralizado de errores con feedback en consola.
   */
  private handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Error en la operación';
    console.error(`[TaxForm Error - ${this.isEditMode() ? 'EDIT' : 'CREATE'}]:`, message);
  }
}