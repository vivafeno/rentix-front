import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfiguration } from '../../api/api-configuration';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * IMPORTACIONES DE FUNCIONES GENERADAS POR OPENAPI
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
 * Proporciona acceso al inventario técnico, métricas de superficie y gestión de ciclo de vida.
 * * * Estándares Blueprint 2026:
 * - Comunicación asíncrona mediante Promesas (firstValueFrom).
 * - Mapeo estricto al cuerpo de la respuesta (Body extraction).
 * - Soporte para activos técnicos (Superficies, Eficiencia, Amenities).
 * * @version 2026.1.1
 * @author Rentix Core Team
 */
@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfiguration);

  /**
   * Recupera el catálogo completo de inmuebles operativos.
   * Ahora incluye métricas de superficie y datos técnicos por defecto.
   */
  async findAll(): Promise<Property[]> {
    return await firstValueFrom(
      propertyControllerFindAll(this.http, this.config.rootUrl, {}).pipe(
        map(r => r.body as Property[])
      )
    );
  }

  /**
   * Obtiene el expediente técnico detallado de un activo.
   * Útil para vistas de detalle o edición de características físicas.
   * @param id UUID del activo.
   */
  async findOne(id: string): Promise<Property> {
    return await firstValueFrom(
      propertyControllerFindOne(this.http, this.config.rootUrl, { id }).pipe(
        map(r => r.body as Property)
      )
    );
  }

  /**
   * Registra un nuevo activo inmobiliario.
   * Requiere datos de superficie (Total/Útil) y dirección física.
   * @param body DTO alineado con los requerimientos técnicos del backend.
   */
  async create(body: CreatePropertyDto): Promise<Property> {
    return await firstValueFrom(
      propertyControllerCreate(this.http, this.config.rootUrl, { body }).pipe(
        map(r => r.body as Property)
      )
    );
  }

  /**
   * Actualiza atributos físicos o técnicos del inmueble.
   * Soporta actualización parcial (PATCH).
   */
  async update(id: string, body: UpdatePropertyDto): Promise<Property> {
    return await firstValueFrom(
      propertyControllerUpdate(this.http, this.config.rootUrl, { id, body }).pipe(
        map(r => r.body as Property)
      )
    );
  }

  /**
   * Recupera activos residentes en la papelera de reciclaje.
   */
  async findTrash(): Promise<Property[]> {
    return await firstValueFrom(
      propertyControllerFindTrash(this.http, this.config.rootUrl, {}).pipe(
        map(r => r.body as Property[])
      )
    );
  }

  /**
   * Revierte el estado de borrado de un inmueble.
   */
  async restore(id: string): Promise<Property> {
    return await firstValueFrom(
      propertyControllerRestore(this.http, this.config.rootUrl, { id }).pipe(
        map(r => r.body as Property)
      )
    );
  }

  /**
   * Ejecuta el borrado lógico del activo (Mover a papelera).
   */
  async remove(id: string): Promise<Property> {
    return await firstValueFrom(
      propertyControllerRemove(this.http, this.config.rootUrl, { id }).pipe(
        map(r => r.body as Property)
      )
    );
  }
}