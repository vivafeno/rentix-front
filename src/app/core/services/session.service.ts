import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs'; // 👈 IMPORTANTE
import { ApiConfiguration } from '../../api/api-configuration';

// Modelos
import { MeDto, CompanyMeDto } from '../../api/models';

// Funciones
import { userControllerGetMe } from '../../api/fn/users/user-controller-get-me';
import { companyControllerGetMyCompanies } from '../../api/fn/companies/company-controller-get-my-companies';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);
  private router = inject(Router);

  // --- STATE (Signals) ---
  private _user = signal<MeDto | null>(null);
  private _companies = signal<CompanyMeDto[]>([]);
  // Intentamos recuperar la empresa seleccionada de la memoria
  private _selectedCompanyId = signal<string | null>(localStorage.getItem('selected_company_id'));

  // --- COMPUTED ---
  readonly user = this._user.asReadonly();
  readonly companies = this._companies.asReadonly();

  readonly currentCompany = computed(() => 
    this._companies().find(c => c.companyId === this._selectedCompanyId()) || null
  );

  readonly currentRole = computed(() => 
    this.currentCompany()?.role || 'VIEWER'
  );

  // --- ACCIONES ---

  /**
   * 1. Guarda tokens
   * 2. Descarga datos del usuario (espera a que termine)
   * 3. Redirige
   */
  async loginSuccess(accessToken: string, refreshToken: string) {
    // A. Guardar Tokens
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);

    // B. Cargar datos (Esperamos con await)
    await this.refreshSessionData();

    // C. Decidir adónde ir
    if (this._companies().length === 0) {
        // Caso raro: Usuario sin ninguna empresa -> Lo mandamos a crear una o contactar soporte
        // Por ahora, al selector igual para que vea el mensaje de "vacío"
        this.router.navigate(['/select-company']);
    } 
    else if (this._selectedCompanyId() && this.currentCompany()) {
      // Si ya tenía una empresa seleccionada válida, al Dashboard
      this.router.navigate(['/app/dashboard']);
    } 
    else {
      // Si es la primera vez o caducó la selección, a elegir empresa
      this.router.navigate(['/select-company']); 
    }
  }

  async refreshSessionData() {
    try {
      // Lanzamos las dos peticiones en paralelo y las convertimos a promesas
      const pUser = firstValueFrom(userControllerGetMe(this.http, this.config.rootUrl));
      const pCompanies = firstValueFrom(companyControllerGetMyCompanies(this.http, this.config.rootUrl));

      // Esperamos a que AMBAS terminen
      const [userResponse, companiesResponse] = await Promise.all([pUser, pCompanies]);

      // Guardamos en las señales (Signals)
      // Nota: Usamos .body porque ng-openapi-gen devuelve StrictHttpResponse
      this._user.set(userResponse.body);
      this._companies.set(companiesResponse.body);

      console.log('✅ Sesión actualizada:', { 
        user: userResponse.body, 
        companies: companiesResponse.body 
      });

    } catch (error) {
      console.error('❌ Error cargando datos de sesión', error);
      // Si falla la carga de datos (ej. token inválido), cerramos sesión
      this.logout();
    }
  }

  selectCompany(companyId: string) {
    const exists = this._companies().some(c => c.companyId === companyId);
    if (exists) {
      this._selectedCompanyId.set(companyId);
      localStorage.setItem('selected_company_id', companyId);
      this.router.navigate(['/app/dashboard']);
    }
  }

  logout() {
    this._user.set(null);
    this._companies.set([]);
    this._selectedCompanyId.set(null);
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('selected_company_id');
    
    this.router.navigate(['/login']);
  }
}