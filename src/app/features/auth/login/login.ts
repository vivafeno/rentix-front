import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';
import { ApiService } from '../../../core/api/api.service';
import { LoginDto } from '../../../api/models/login-dto';

/**
 * @description Componente de autenticación de usuario (Blueprint 2026).
 * Implementa enrutamiento inteligente basado en AppRole para evitar bloqueos de contexto.
 * * @author Gemini Blueprint 2026
 * @version 1.5.0
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  // --- SIGNALS DE ESTADO ---
  readonly isLoading = this.session.isLoading;
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  /**
   * @description Procesa el intento de login.
   * Tras el éxito, bifurca la navegación: ADMIN -> Dashboard / USER -> Selector.
   */
  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.isLoading()) return;

    this.errorMessage.set(null);

    try {
      // 1. Llamada al API
      const response = await this.api.post<{ accessToken: string; refreshToken: string }>(
        '/auth/login', 
        this.form.value as LoginDto
      );

      if (response.accessToken) {
        // 2. Persistencia y carga de perfil en el SessionService
        // Es vital que loginSuccess devuelva o actualice los datos del usuario antes de navegar
        await this.session.loginSuccess(
          response.accessToken, 
          response.refreshToken
        );

        // 3. ENRUTAMIENTO INTELIGENTE (Solución al bloqueo del ADMIN)
        const user = this.session.user();
        const isPlatformAdmin = user?.appRole === 'SUPERADMIN' || user?.appRole === 'ADMIN';

        if (isPlatformAdmin) {
          /** @description Delegados técnicos: Bypass del selector de empresa */
          await this.router.navigate(['/app/dashboard']);
        } else {
          /** @description Roles patrimoniales: Obligados a elegir contexto */
          await this.router.navigate(['/select-company']);
        }
      }
    } catch (err: any) {
      this.handleError(err);
    }
  }

  /**
   * @description Centraliza la gestión de errores de UI.
   */
  private handleError(err: any): void {
    console.error('❌ [Login]: Fallo de autenticación', err);
    const status = err.status || err.statusCode;
    
    if (status === 401) {
      this.errorMessage.set('Credenciales incorrectas.');
    } else {
      this.errorMessage.set('Error de conexión con el servidor de Rentix.');
    }
  }
}