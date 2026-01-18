import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { ApiConfiguration } from '../../api/api-configuration';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * IMPORTACIONES DESDE OPENAPI
 * Basadas en la generación funcional de ng-openapi-gen para el módulo Tenant.
 */
import { tenantControllerFindAll } from '../../api/fn/tenants/tenant-controller-find-all';
import { tenantControllerFindOne } from '../../api/fn/tenants/tenant-controller-find-one';
import { tenantControllerCreate } from '../../api/fn/tenants/tenant-controller-create';
import { tenantControllerUpdate } from '../../api/fn/tenants/tenant-controller-update';
import { tenantControllerRemove } from '../../api/fn/tenants/tenant-controller-remove';
import { Tenant, CreateTenantDto, UpdateTenantDto } from '../../api/models';

/**
 * Servicio de fachada para la gestión integral de Arrendatarios (Tenants).
 * Centraliza la comunicación con la API y el mapeo estricto de respuestas.
 * * Estándares Blueprint 2026:
 * - Comunicación asíncrona mediante Promises (firstValueFrom).
 * - Tipado estricto en el pipe de respuesta (HttpResponse<any>).
 * - Aislamiento por companyId gestionado transparentemente por el Backend.
 * * @version 2026.1.17
 * @author Rentix
 */
@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfiguration);

  /**
   * Recupera el listado de arrendatarios vinculados a la empresa activa.
   * @returns Promise con el array de entidades Tenant.
   */
  public async findAll(): Promise<Tenant[]> {
  try {
    const response = await firstValueFrom(
      tenantControllerFindAll(this.http, this.config.rootUrl, {})
    );
    
    // ng-openapi-gen suele devolver un StrictHttpResponse. 
    // Extraemos el body y nos aseguramos de que sea un Array.
    const data = (response as any)?.body ?? response;
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error en TenantService.findAll:', error);
    return []; 
  }
}

  /**
   * Recupera un arrendatario específico por su UUID.
   * @param id UUID del tenant.
   */
  public async findOne(id: string): Promise<Tenant> {
    return await firstValueFrom(
      tenantControllerFindOne(this.http, this.config.rootUrl, { id }).pipe(
        map((r: HttpResponse<any>) => r.body as Tenant)
      )
    );
  }

  /**
   * Registra un nuevo arrendatario en el sistema.
   * Flujo: Usuario -> TenantProfile -> Aislamiento de Empresa.
   * @param body Datos validados para la creación (CreateTenantDto).
   */
  public async create(body: CreateTenantDto): Promise<Tenant> {
    return await firstValueFrom(
      tenantControllerCreate(this.http, this.config.rootUrl, { body }).pipe(
        map((r: HttpResponse<any>) => r.body as Tenant)
      )
    );
  }

  /**
   * Actualiza parcialmente la información de un arrendatario.
   * @param id UUID del tenant.
   * @param body DTO con los campos a modificar.
   */
  public async update(id: string, body: UpdateTenantDto): Promise<Tenant> {
    return await firstValueFrom(
      tenantControllerUpdate(this.http, this.config.rootUrl, { id, body }).pipe(
        map((r: HttpResponse<any>) => r.body as Tenant)
      )
    );
  }

  /**
   * Realiza el borrado lógico del arrendatario.
   * Sincronizado con el Soft Delete del backend para mantener integridad.
   * @param id UUID del tenant.
   */
  public async remove(id: string): Promise<void> {
    return await firstValueFrom(
      tenantControllerRemove(this.http, this.config.rootUrl, { id }).pipe(
        map(() => undefined)
      )
    );
  }
}