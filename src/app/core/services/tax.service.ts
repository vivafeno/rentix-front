import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { ApiConfiguration } from '../../api/api-configuration';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * IMPORTACIONES DESDE OPENAPI
 * Basadas en la generación funcional de ng-openapi-gen.
 */
import { taxControllerFindAll } from '../../api/fn/taxes/tax-controller-find-all';
import { taxControllerFindOne } from '../../api/fn/taxes/tax-controller-find-one';
import { taxControllerCreate } from '../../api/fn/taxes/tax-controller-create';
import { taxControllerUpdate } from '../../api/fn/taxes/tax-controller-update';
import { taxControllerRemove } from '../../api/fn/taxes/tax-controller-remove';
import { taxControllerFindAllDeleted } from '../../api/fn/taxes/tax-controller-find-all-deleted';
import { taxControllerRestore } from '../../api/fn/taxes/tax-controller-restore';
import { Tax, CreateTaxDto, UpdateTaxDto } from '../../api/models';

/**
 * Servicio de fachada para la gestión integral del catálogo de impuestos.
 * Centraliza la comunicación con la API y el mapeo estricto de respuestas.
 * * * Estándares Blueprint 2026:
 * - Control CRUD total sin borrado físico (integridad referencial).
 * - Gestión de papelera mediante estados manuales (isActive, deletedAt).
 * - Tipado estricto en el pipe de respuesta (HttpResponse<any>).
 * * @version 2026.1.6
 * @author Rentix
 */
@Injectable({
  providedIn: 'root'
})
export class TaxService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfiguration);

  /**
   * Recupera el listado de impuestos operativos (activos) de la empresa.
   * @returns Promise con el array de entidades Tax.
   */
  public async findAll(): Promise<Tax[]> {
    return await firstValueFrom(
      taxControllerFindAll(this.http, this.config.rootUrl, {}).pipe(
        map((r: HttpResponse<any>) => r.body as Tax[])
      )
    );
  }

  /**
   * Recupera un impuesto específico por su identificador.
   * Crucial para el modo edición (patchValue).
   * @param id UUID del impuesto.
   */
  public async findOne(id: string): Promise<Tax> {
    return await firstValueFrom(
      taxControllerFindOne(this.http, this.config.rootUrl, { id }).pipe(
        map((r: HttpResponse<any>) => r.body as Tax)
      )
    );
  }

  /**
   * Obtiene exclusivamente los registros que están en la papelera.
   * @returns Promise con impuestos donde deletedAt !== null.
   */
  public async findAllDeleted(): Promise<Tax[]> {
    return await firstValueFrom(
      taxControllerFindAllDeleted(this.http, this.config.rootUrl, {}).pipe(
        map((r: HttpResponse<any>) => r.body as Tax[])
      )
    );
  }

  /**
   * Registra un nuevo tipo impositivo.
   * @param body Datos validados para la creación.
   */
  public async create(body: CreateTaxDto): Promise<Tax> {
    return await firstValueFrom(
      taxControllerCreate(this.http, this.config.rootUrl, { body }).pipe(
        map((r: HttpResponse<any>) => r.body as Tax)
      )
    );
  }

  /**
   * Actualiza parcialmente un impuesto existente (PATCH).
   * @param id UUID del impuesto.
   * @param body DTO con los campos a modificar.
   */
  public async update(id: string, body: UpdateTaxDto): Promise<Tax> {
    return await firstValueFrom(
      taxControllerUpdate(this.http, this.config.rootUrl, { id, body }).pipe(
        map((r: HttpResponse<any>) => r.body as Tax)
      )
    );
  }

  /**
   * Mueve un impuesto a la papelera (Soft Delete manual).
   * En el backend esto marca isActive=false y rellena deletedAt.
   * @param id UUID del impuesto.
   */
  public async remove(id: string): Promise<Tax> {
    return await firstValueFrom(
      taxControllerRemove(this.http, this.config.rootUrl, { id }).pipe(
        map((r: HttpResponse<any>) => r.body as Tax)
      )
    );
  }

  /**
   * Restaura un impuesto de la papelera al catálogo principal.
   * En el backend esto limpia deletedAt y marca isActive=true.
   * @param id UUID del impuesto.
   */
  public async restore(id: string): Promise<Tax> {
    return await firstValueFrom(
      taxControllerRestore(this.http, this.config.rootUrl, { id }).pipe(
        map((r: HttpResponse<any>) => r.body as Tax)
      )
    );
  }
}