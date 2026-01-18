import { Injectable, computed, inject, Signal, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { injectQuery, QueryClient } from '@tanstack/angular-query-experimental';

import { ApiService } from '../api/api.service';
import { MeDto } from '../../api/models';

/**
 * @description Servicio central de gestión de sesión, contexto patrimonial y preferencias visuales (Blueprint 2026).
 * Actúa como la "Single Source of Truth" para el estado del usuario, la empresa activa y el tema de la UI.
 * Implementa arquitectura Zoneless mediante Signals y gestión de caché con TanStack Query.
 * @author Gemini / Rentix Team
 * @version 1.3.0
 */
@Injectable({
  providedIn: 'root'
})
export class SessionService {
  /** @description Cliente de API para comunicaciones REST basadas en Fetch nativo. */
  private readonly api = inject(ApiService);

  /** @description Motor de navegación de Angular para redirecciones de flujo. */
  private readonly router = inject(Router);

  /** @description Gestor de caché y estado de TanStack Query mediante inyección nativa. */
  private readonly queryClient = inject(QueryClient);

  // --- ESTADO VISUAL (Dark Mode) ---

  /** * @description Signal reactiva que controla el estado del tema oscuro.
   * Se inicializa leyendo la preferencia persistida en el almacenamiento local.
   * @type {WritableSignal<boolean>}
   */
  readonly darkMode = signal<boolean>(localStorage.getItem('theme') === 'dark');

  // --- ESTADO DECLARATIVO (TanStack Query) ---

  /** * @description Query interna que sincroniza el perfil del usuario autenticado.
   * Se activa automáticamente si detecta un token de acceso.
   */
  private userQuery = injectQuery(() => ({
    queryKey: ['user-me'],
    queryFn: () => this.api.get<MeDto>('/users/me'),
    enabled: !!localStorage.getItem('access_token'),
    staleTime: Infinity,
    retry: false
  }));

  // --- SIGNALS PÚBLICAS (Readonly & Context-Safe) ---

  /** * @description Datos del perfil del usuario actual obtenidos de la caché de TanStack.
   * @returns {Signal<MeDto | undefined>} Perfil del usuario hidratado.
   */
  readonly user = computed(() => this.userQuery.data()) as Signal<MeDto | undefined>;

  /**
   * @description Estado de carga global de la sesión.
   * Evita bloqueos en el Login si no existe un token previo.
   * @returns {Signal<boolean>}
   */
  readonly isLoading = computed(() => {
    const hasToken = !!localStorage.getItem('access_token');
    if (!hasToken) return false;
    return this.userQuery.isPending();
  }) as Signal<boolean>;

  /** * @description Identificador de la empresa seleccionada en el contexto actual.
   * @returns {Signal<string | null>} UUID de la empresa almacenada.
   */
  readonly companyId = computed(() => localStorage.getItem('selected_company_id'));

  /** * @description Lista de roles y empresas asociadas al usuario autenticado.
   * @returns {Signal<any[]>} Colección de objetos CompanyRole.
   */
  readonly companies = computed(() => this.user()?.companyRoles || []);

  /** * @description Datos de la empresa activa en el contexto patrimonial seleccionado.
   * @returns {Signal<any | null>} Objeto de empresa o null si no hay selección.
   */
  readonly currentCompany = computed(() =>
    this.companies().find(c => c.companyId === this.companyId()) || null
  );

  /** * @description Rol operativo del usuario en la empresa seleccionada (OWNER, TENANT, VIEWER).
   * @returns {Signal<string>} Nombre del rol o 'VIEWER' por defecto.
   */
  readonly currentRole = computed(() => this.currentCompany()?.role || 'VIEWER');

  /**
   * @constructor
   * @description Inicializa el servicio y establece el efecto reactivo para el tema visual.
   */
  constructor() {
    /** * @description Sincronización automática del DOM y LocalStorage.
     * Al estar en el constructor, se ejecuta inmediatamente y cada vez que darkMode cambia.
     */
    effect(() => {
      const isDark = this.darkMode();
      
      // 1. Sincronizar clase en el elemento raíz para Tailwind v4
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // 2. Persistir preferencia
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  // --- MÉTODOS DE TEMA (Dark Mode) ---

  /**
   * @description Alterna entre modo claro y oscuro. 
   * La persistencia y el cambio de clase se gestionan automáticamente vía effect.
   * @returns {void}
   */
  toggleDarkMode(): void {
    this.darkMode.update(v => !v);
  }

  // --- GESTIÓN DE FLUJO Y SESIÓN ---

  /**
   * @description Procesa el éxito del login aplicando jerarquía de roles (Blueprint 2026).
   * @param {string} accessToken - Token JWT de acceso.
   * @param {string} refreshToken - Token de refresco.
   */
  async loginSuccess(accessToken: string, refreshToken: string): Promise<void> {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);

    try {
      const userData = await this.queryClient.fetchQuery({
        queryKey: ['user-me'],
        queryFn: () => this.api.get<MeDto>('/users/me'),
      });

      const isPrivileged = userData.appRole === 'SUPERADMIN' || userData.appRole === 'ADMIN';
      const userCompanies = userData.companyRoles || [];

      if (isPrivileged) {
        await this.router.navigateByUrl('/app/dashboard');
      } else if (userCompanies.length === 0) {
        await this.router.navigateByUrl('/create-company');
      } else if (userCompanies.length === 1) {
        await this.selectCompany(userCompanies[0].companyId);
      } else {
        await this.router.navigateByUrl('/select-company');
      }
    } catch (err) {
      this.logout();
    }
  }

  /**
   * @description Establece el contexto patrimonial (Empresa) activo mediante intercambio de tokens.
   * @param {string} companyId - Identificador único de la empresa.
   */
  async selectCompany(companyId: string): Promise<void> {
    try {
      const res = await this.api.post<any>('/context/select-company', { companyId });
      if (res?.accessToken) {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('selected_company_id', companyId);
        window.location.href = '/app/dashboard'; 
      }
    } catch (err) {
      console.error('❌ [Session] Error selectCompany:', err);
      await this.router.navigateByUrl('/select-company');
    }
  }

  /**
   * @description Cierra la sesión de forma atómica, limpiando almacenamiento y caché de queries.
   */
  logout(): void {
    localStorage.clear();
    this.queryClient.clear();
    window.location.href = '/login';
  }
}