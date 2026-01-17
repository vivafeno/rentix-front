import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfiguration } from '../../api/api-configuration';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * IMPORTACIONES DE FUNCIONES GENERADAS POR OPENAPI
 * Estas funciones encapsulan las llamadas HTTP a los endpoints de NestJS.
 */
import { propertyControllerFindAll } from '../../api/fn/properties/property-controller-find-all';
import { propertyControllerFindOne } from '../../api/fn/properties/property-controller-find-one';
import { propertyControllerCreate } from '../../api/fn/properties/property-controller-create';
import { propertyControllerUpdate } from '../../api/fn/properties/property-controller-update';
import { propertyControllerRemove } from '../../api/fn/properties/property-controller-remove';
import { propertyControllerFindTrash } from '../../api/fn/properties/property-controller-find-trash';
import { propertyControllerRestore } from '../../api/fn/properties/property-controller-restore';

import { Property, CreatePropertyDto, UpdatePropertyDto } from '../../api/models';

/**
 * Servicio de gestión de Activos Inmobiliarios (Properties).
 * Proporciona métodos para el ciclo de vida completo de un activo: creación, consulta, edición y papelería.
 * * @version 2026.1.0
 * @author Rentix Core Team
 */
@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  /** Cliente HTTP de Angular para la ejecución de peticiones */
  private readonly http = inject(HttpClient);
  
  /** Configuración global de la API (Base URL) */
  private readonly config = inject(ApiConfiguration);

  /**
   * NOTA TÉCNICA:
   * El generador de OpenAPI devuelve objetos del tipo StrictHttpResponse<T>.
   * Para trabajar directamente con el modelo de dominio (Property), 
   * aplicamos un operador .pipe(map(r => r.body)) en cada petición.
   */

  /**
   * Recupera todos los inmuebles activos vinculados al contexto de la empresa actual.
   * @returns Una promesa con el listado de activos.
   */
  async findAll(): Promise<Property[]> {
    return await firstValueFrom(
      propertyControllerFindAll(this.http, this.config.rootUrl, {}).pipe(
        map(r => r.body as Property[])
      )
    );
  }

  /**
   * Obtiene el expediente detallado de un activo específico.
   * @param id Identificador único (UUID) del inmueble.
   * @returns Una promesa con los datos del activo y su dirección anidada.
   */
  async findOne(id: string): Promise<Property> {
    return await firstValueFrom(
      propertyControllerFindOne(this.http, this.config.rootUrl, { id }).pipe(
        map(r => r.body as Property)
      )
    );
  }

  /**
   * Registra una nueva unidad inmobiliaria en el sistema.
   * Este método dispara la persistencia en cascada de la dirección asociada en el backend.
   * @param body DTO con los datos del nuevo activo.
   * @returns El activo recién creado.
   */
  async create(body: CreatePropertyDto): Promise<Property> {
    return await firstValueFrom(
      propertyControllerCreate(this.http, this.config.rootUrl, { body }).pipe(
        map(r => r.body as Property)
      )
    );
  }

  /**
   * Actualiza los atributos de un activo existente.
   * @param id Identificador único (UUID) del activo a modificar.
   * @param body DTO con los campos actualizados.
   * @returns El activo actualizado tras la persistencia.
   */
  async update(id: string, body: UpdatePropertyDto): Promise<Property> {
    return await firstValueFrom(
      propertyControllerUpdate(this.http, this.config.rootUrl, { id, body }).pipe(
        map(r => r.body as Property)
      )
    );
  }

  /**
   * Recupera el listado de activos que han sido marcados como inactivos (Papelera).
   * @returns Listado de activos con estado isActive = false.
   */
  async findTrash(): Promise<Property[]> {
    return await firstValueFrom(
      propertyControllerFindTrash(this.http, this.config.rootUrl, {}).pipe(
        map(r => r.body as Property[])
      )
    );
  }

  /**
   * Revierte el borrado lógico de un activo, devolviéndolo al listado operativo.
   * @param id Identificador único (UUID) del activo a restaurar.
   * @returns El activo reactivado.
   */
  async restore(id: string): Promise<Property> {
    return await firstValueFrom(
      propertyControllerRestore(this.http, this.config.rootUrl, { id }).pipe(
        map(r => r.body as Property)
      )
    );
  }

  /**
   * Ejecuta el borrado lógico (desactivación) de un activo.
   * El activo deja de ser visible en el listado principal pero permanece en base de datos.
   * @param id Identificador único (UUID) del activo a eliminar.
   * @returns El activo en su nuevo estado inactivo.
   */
  async remove(id: string): Promise<Property> {
    return await firstValueFrom(
      propertyControllerRemove(this.http, this.config.rootUrl, { id }).pipe(
        map(r => r.body as Property)
      )
    );
  }
}