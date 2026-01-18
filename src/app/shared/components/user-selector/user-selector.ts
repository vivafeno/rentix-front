import { Component, EventEmitter, Output, input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

/** * @description Imports estandarizados según rutas de proyecto 
 */
import { User } from '../../../api/models';
import { UserService } from '../../../core/services/user.service';

/**
 * @description Componente atómico para la selección o creación de usuarios base.
 * Implementa el estándar Blueprint 2026 con tipado estricto y JSDoc.
 * * * Responsabilidades:
 * - Gestionar la búsqueda reactiva de identidades.
 * - Realizar el alta rápida (Draft) cumpliendo el contrato de la API.
 * - Proveer datos de perfil temporal al componente padre.
 * * @version 2026.1.17
 */
@Component({
  selector: 'app-user-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-selector.html',
  styleUrls: ['./user-selector.scss']
})
export class UserSelectorComponent {
  private readonly _fb = inject(FormBuilder);
  private readonly _userService = inject(UserService);

  /** @description Rol de aplicación definido por el contexto del padre. */
  public targetRole = input.required<string>();

  /** @description Emite el usuario y metadatos adicionales al padre. */
  @Output() onUserSelected = new EventEmitter<User & { tempProfile?: any }>();

  /** * @description Emisor de usuario seleccionado. 
   * Debe estar tipado con <User> para que el padre lo reconozca.
   */
  @Output() userSelected = new EventEmitter<User>();

  public select(user: User): void {
    this.userSelected.emit(user);
  }

  /** @description Estados reactivos de la interfaz. */
  public isCreating = signal<boolean>(false);
  public isSearching = signal<boolean>(false);
  public results = signal<User[]>([]);

  /** * @description Formulario de alta rápida. 
   * Incluye campos de perfil para UX, aunque no pertenezcan al CreateUserDto base.
   */
  public quickUserForm = this._fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['Rentix2026!', [Validators.required, Validators.minLength(6)]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]]
  });

  /**
   * @description Ejecuta búsqueda asíncrona de usuarios.
   * @param {string} term Criterio de búsqueda (min 3 caracteres).
   * @returns {Promise<void>}
   */
  public async search(term: string): Promise<void> {
    if (term.length < 3) {
      this.results.set([]);
      return;
    }

    this.isSearching.set(true);
    try {
      const data = await this._userService.search(term);
      this.results.set(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[UserSelector]: Fallo en búsqueda asíncrona', error);
      this.results.set([]);
    } finally {
      this.isSearching.set(false);
    }
  }

  /**
   * @description Procesa el alta rápida respetando el contrato CreateUserDto.
   * Los datos de nombre/apellidos se envían como metadatos en el evento emitido.
   * @returns {Promise<void>}
   */
  public async handleQuickCreate(): Promise<void> {
    if (this.quickUserForm.invalid) return;

    const formValues = this.quickUserForm.getRawValue();

    try {
      // 1. Creación en API: Solo campos permitidos por CreateUserDto
      const newUser = await this._userService.create({
        email: formValues.email!,
        password: formValues.password!,
        appRole: this.targetRole() as any
      });
      
      // 2. Notificar al padre con el usuario y el perfil temporal capturado
      this.onUserSelected.emit({
        ...newUser,
        tempProfile: {
          firstName: formValues.firstName,
          lastName: formValues.lastName
        }
      });
    } catch (error) {
      console.error('[UserSelector]: Error en flujo de alta rápida', error);
    }
  }
}