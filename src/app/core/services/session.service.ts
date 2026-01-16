import { Injectable, computed, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiConfiguration } from '../../api/api-configuration';

// --- MODELOS ---
import { MeDto, CompanyMeDto } from '../../api/models';

// --- FUNCIONES API (OpenAPI) ---
import { userControllerGetMe } from '../../api/fn/users/user-controller-get-me';
import { companyControllerGetMyCompanies } from '../../api/fn/companies/company-controller-get-my-companies';
import { companyContextControllerSelectCompany } from '../../api/fn/context/company-context-controller-select-company';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);
  private router = inject(Router);

  // --------------------------------------------------------------------------------
  // ESTADO (Signals Privados)
  // --------------------------------------------------------------------------------
  private _user = signal<MeDto | null>(null);
  private _companies = signal<CompanyMeDto[]>([]);
  private _selectedCompanyId = signal<string | null>(localStorage.getItem('selected_company_id'));

  // 🚨 SEMÁFORO DE CARGA (Vital para F5)
  // Si hay token al iniciar, nacemos en estado "cargando" para bloquear redirecciones
  public isLoading = signal<boolean>(!!localStorage.getItem('access_token'));

  // --------------------------------------------------------------------------------
  // LECTURA (Signals Públicos & Computados)
  // --------------------------------------------------------------------------------

  readonly user = this._user.asReadonly();
  readonly companies = this._companies.asReadonly();
  readonly companyId = this._selectedCompanyId.asReadonly();

  readonly currentCompany = computed(() =>
    this._companies().find(c => c.companyId === this._selectedCompanyId()) || null
  );

  readonly currentRole = computed(() =>
    this.currentCompany()?.role || 'VIEWER'
  );

  // --------------------------------------------------------------------------------
  // 👮 CONSTRUCTOR: EL POLICÍA DE TRÁFICO
  // --------------------------------------------------------------------------------
  constructor() {
    // 1. AUTO-ARRANQUE (Fuera del effect para que solo ocurra una vez)
    const token = localStorage.getItem('access_token');
    if (token) {
      console.log('🔄 Sesión detectada. Iniciando recarga de datos...');
      this.refreshSessionData();
    }

    // 2. EL EFECTO (Vigila la navegación)
    effect(() => {
      // 🚨 BLOQUEO: Si estamos cargando datos, NO redirigimos a ningún lado. Esperamos.
      if (this.isLoading()) {
        return;
      }

      const user = this._user();
      const companies = this._companies();

      // Solo actuamos si el usuario ya ha cargado
      if (user) {
        const currentUrl = this.router.url;

        // CASO: Usuario sin empresas
        if (companies.length === 0) {
          // Excepciones para no molestar si está creando empresa o en login
          if (!currentUrl.includes('create-company') &&
            !currentUrl.includes('login') &&
            !currentUrl.includes('select-company')) {

            console.log('🔀 Redirigiendo a selección (Usuario sin empresas)');
            this.router.navigate(['/select-company']);
          }
        }
      }
    });
  }

  // --------------------------------------------------------------------------------
  // MÉTODOS DE GESTIÓN DE SESIÓN
  // --------------------------------------------------------------------------------

  async loginSuccess(accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);

    // Activamos semáforo antes de pedir datos
    this.isLoading.set(true);
    await this.refreshSessionData();

    // Capturamos el estado actual
    const companies = this._companies();
    const currentId = this._selectedCompanyId();
    const currentCompany = this.currentCompany();

    // Lógica de redirección
    if (companies.length === 0) {
      this.router.navigate(['/select-company']);
    }
    else if (currentId && currentCompany) {
      this.router.navigate(['/app/dashboard']);
    }
    else {
      this.router.navigate(['/select-company']);
    }
  }

  async refreshSessionData() {
    try {
      this.isLoading.set(true); // Aseguramos bloqueo

      const pUser = firstValueFrom(userControllerGetMe(this.http, this.config.rootUrl));
      const pCompanies = firstValueFrom(companyControllerGetMyCompanies(this.http, this.config.rootUrl));

      const [userResponse, companiesResponse] = await Promise.all([pUser, pCompanies]);

      this._user.set(userResponse.body);
      this._companies.set(companiesResponse.body);

      const currentId = this._selectedCompanyId();
      if (currentId && !companiesResponse.body.some(c => c.companyId === currentId)) {
        this._selectedCompanyId.set(null);
        localStorage.removeItem('selected_company_id');
      }

      console.log('✅ Datos recargados OK');

    } catch (error) {
      console.error('❌ Error cargando datos de sesión', error);
      this.logout();
    } finally {
      // 🚨 IMPORTANTE: Apagamos el semáforo pase lo que pase para liberar la UI
      this.isLoading.set(false);
    }
  }

// src/app/core/services/session.service.ts

async selectCompany(companyId: string) {
  try {
    this.isLoading.set(true);

    const response: any = await firstValueFrom(
      this.http.post(`${this.config.rootUrl}/context/select-company`, { companyId })
    );

    // 🚨 CLAVE 1: Extraer el accessToken de la respuesta
    const newToken = response.accessToken;

    if (newToken) {
      // 🚨 CLAVE 2: Sobrescribir el token en el storage
      localStorage.setItem('access_token', newToken);
      localStorage.setItem('selected_company_id', companyId);
      
      this._selectedCompanyId.set(companyId);

      // 🚨 CLAVE 3: Forzar recarga de datos. 
      // Esto hará que el SessionService lea el NUEVO token y actualice el currentRole
      await this.refreshSessionData();
      
      console.log('✅ Contexto de empresa activado en el Token');
      this.router.navigate(['/app/dashboard']);
    }
  } catch (error) {
    console.error('❌ Error seleccionando empresa:', error);
  } finally {
    this.isLoading.set(false);
  }
}

  logout() {
    this._user.set(null);
    this._companies.set([]);
    this._selectedCompanyId.set(null);
    this.isLoading.set(false); // Liberamos semáforo

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('selected_company_id');

    this.router.navigate(['/login']);
  }
}