import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiConfiguration } from '../../api/api-configuration';
import { userControllerFindAll } from '../../api/fn/users/user-controller-find-all';
import { userControllerCreate } from '../../api/fn/users/user-controller-create';
import { User, CreateUserDto } from '../../api/models';

/**
 * @description Servicio de fachada para la gestión de usuarios.
 * * Blueprint 2026: Tipado estricto y rutas centralizadas.
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly _http = inject(HttpClient);
  private readonly _config = inject(ApiConfiguration);

  /**
   * @description Busca usuarios por término (email/nombre).
   */
  public async search(search: string): Promise<User[]> {
    try {
      const response = await firstValueFrom(
        userControllerFindAll(this._http, this._config.rootUrl, { search })
      );
      // Extraemos el cuerpo del wrapper de OpenAPI
      const data = (response as any)?.body ?? response;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('[UserService]: Error en búsqueda', error);
      return [];
    }
  }

  /**
   * @description Crea un nuevo usuario.
   */
  public async create(payload: CreateUserDto): Promise<User> {
    try {
      const response = await firstValueFrom(
        userControllerCreate(this._http, this._config.rootUrl, { body: payload })
      );
      return (response as any)?.body ?? response;
    } catch (error) {
      console.error('[UserService]: Error al crear usuario', error);
      throw error;
    }
  }
}