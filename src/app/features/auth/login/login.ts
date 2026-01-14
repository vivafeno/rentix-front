import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

// Servicios y Configuración
import { SessionService } from '../../../core/services/session.service';
import { ApiConfiguration } from '../../../api/api-configuration';

// Función de la API generada
import { authControllerLogin } from '../../../api/fn/auth/auth-controller-login';
import { LoginDto } from '../../../api/models/login-dto';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  // Inyecciones
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);
  private session = inject(SessionService);

  // Estado visual
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Formulario Reactivo
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const loginData: LoginDto = {
      email: this.form.value.email!,
      password: this.form.value.password!
    };

    // Llamada a la API usando la función generada (Tree-shakable)
    authControllerLogin(this.http, this.config.rootUrl, { body: loginData })
      .subscribe({
        next: (response) => {
          // Éxito: Delegamos en el SessionService para guardar tokens y redirigir
          this.session.loginSuccess(response.body.accessToken, response.body.refreshToken);
        },
        error: (err) => {
          console.error(err);
          this.isLoading.set(false);
          this.errorMessage.set('Credenciales incorrectas o error en el servidor.');
        }
      });
  }
}