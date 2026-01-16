import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfiguration } from '../../api/api-configuration';
import { firstValueFrom } from 'rxjs';

// Métodos generados por OpenAPI
import { propertyControllerFindAll } from '../../api/fn/properties/property-controller-find-all';
import { propertyControllerFindOne } from '../../api/fn/properties/property-controller-find-one';
import { propertyControllerCreate } from '../../api/fn/properties/property-controller-create'; // 🆕 Añadido
import { propertyControllerUpdate } from '../../api/fn/properties/property-controller-update';
import { propertyControllerRemove } from '../../api/fn/properties/property-controller-remove';

// Modelos y DTOs
import { Property, CreatePropertyDto, UpdatePropertyDto } from '../../api/models';
import { propertyControllerFindTrash, propertyControllerRestore } from '../../api/functions';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);

  /**
   * Procesa la respuesta de la API para asegurar que siempre trabajamos con objetos.
   * Resuelve problemas de parseo si el backend devuelve strings o respuestas anidadas.
   */
  private unwrap<T>(response: any): T {
    const data = response?.body ?? response;
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        return data as T;
      }
    }
    return data;
  }

  /** Obtiene todos los inmuebles de la empresa activa */
  async findAll(): Promise<Property[]> {
    const res = await firstValueFrom(
      propertyControllerFindAll(this.http, this.config.rootUrl, {})
    );
    return this.unwrap<Property[]>(res);
  }

  /** Obtiene el detalle de un inmueble por su ID */
  async findOne(id: string): Promise<Property> {
    const res = await firstValueFrom(
      propertyControllerFindOne(this.http, this.config.rootUrl, { id })
    );
    return this.unwrap<Property>(res);
  }

  /** Crea un nuevo inmueble */
  async create(body: CreatePropertyDto): Promise<Property> {
    const res = await firstValueFrom(
      propertyControllerCreate(this.http, this.config.rootUrl, { body })
    );
    return this.unwrap<Property>(res);
  }

  /** Actualiza un inmueble existente */
  async update(id: string, body: UpdatePropertyDto): Promise<Property> {
    const res = await firstValueFrom(
      propertyControllerUpdate(this.http, this.config.rootUrl, { id, body })
    );
    return this.unwrap<Property>(res);
  }

  async findTrash(): Promise<Property[]> {
  const res = await firstValueFrom(
    // Asumiendo que has regenerado el cliente OpenAPI con el nuevo endpoint
    propertyControllerFindTrash(this.http, this.config.rootUrl, {})
  );
  return this.unwrap<Property[]>(res);
}

/** Restaura un inmueble */
async restore(id: string): Promise<Property> {
  const res = await firstValueFrom(
    propertyControllerRestore(this.http, this.config.rootUrl, { id })
  );
  return this.unwrap<Property>(res);
}


  async remove(id: string): Promise<void> {
    await firstValueFrom(
      propertyControllerRemove(this.http, this.config.rootUrl, { id })
    );
  }
}