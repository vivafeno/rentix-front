import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// Servicios y Configuración
import { SessionService } from '../../core/services/session.service';
import { ApiConfiguration } from '../../api/api-configuration';

// Funciones de la API (Endpoints)
import { propertyControllerFindAll } from '../../api/fn/properties-inmuebles/property-controller-find-all';
import { contractControllerFindAll } from '../../api/fn/contracts/contract-controller-find-all';
import { clientControllerFindAll } from '../../api/fn/clients/client-controller-find-all';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  public session = inject(SessionService);
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);

  // Estado de las estadísticas (Signals)
  stats = {
    properties: signal(0),
    contracts: signal(0),
    clients: signal(0),
    loading: signal(true)
  };

  ngOnInit() {
    this.loadRealData();
  }

  async loadRealData() {
    // 1. Obtenemos el ID de la empresa actual
    const currentCompany = this.session.currentCompany();

    // ⛔ BLOQUEO DE SEGURIDAD: 
    // Si no hay empresa seleccionada, limpiamos datos, apagamos loading y SALIMOS.
    if (!currentCompany || !currentCompany.companyId) {
      console.warn('Dashboard: No hay empresa seleccionada. Esperando selección...');
      this.stats.properties.set(0);
      this.stats.contracts.set(0);
      this.stats.clients.set(0);
      this.stats.loading.set(false);
      return; // <--- Importante: Aquí se detiene la ejecución.
    }

    // Si llegamos aquí, es que TENEMOS empresa.
    const companyId = currentCompany.companyId;
    const rootUrl = this.config.rootUrl;

    this.stats.loading.set(true);

    try {
      // 2. Pasamos el companyId en los parámetros a todas las llamadas
      const [props, contracts, clients] = await Promise.all([
        firstValueFrom(propertyControllerFindAll(this.http, rootUrl, { companyId: companyId })),
        firstValueFrom(contractControllerFindAll(this.http, rootUrl, { companyId: companyId })),
        firstValueFrom(clientControllerFindAll(this.http, rootUrl, { companyId: companyId }))
      ]);

      // 3. Procesamos los datos
      const propsList = Array.isArray(props.body) ? props.body : [];
      const contractsList = Array.isArray(contracts.body) ? contracts.body : [];
      const clientsList = Array.isArray(clients.body) ? clients.body : [];

      this.stats.properties.set(propsList.length);
      this.stats.contracts.set(contractsList.length);
      this.stats.clients.set(clientsList.length);

    } catch (error) {
      console.error('Error cargando dashboard:', error);
      // En caso de error, dejamos los contadores a 0
      this.stats.properties.set(0);
      this.stats.contracts.set(0);
      this.stats.clients.set(0);
    } finally {
      // 4. Apagamos el loading siempre, haya error o éxito
      this.stats.loading.set(false);
    }
  }
}