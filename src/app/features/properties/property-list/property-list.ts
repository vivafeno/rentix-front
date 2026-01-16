import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; 
import { firstValueFrom } from 'rxjs';

import { ApiConfiguration } from '../../../api/api-configuration';
import { SessionService } from '../../../core/services/session.service';
import { propertyControllerFindAll } from '../../../api/fn/properties/property-controller-find-all';
import { propertyControllerRemove } from '../../../api/fn/properties/property-controller-remove';
import { Property } from '../../../api/models';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './property-list.html'
})
export class PropertyListComponent implements OnInit {
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);
  public session = inject(SessionService);

  properties = signal<Property[]>([]);
  isLoading = signal(false);

  // Mapeo exacto según tu OpenAPI JSON
  availableTypes = [
    { value: 'RESIDENTIAL', label: 'Residencial' },
    { value: 'COMMERCIAL', label: 'Comercial' },
    { value: 'INDUSTRIAL', label: 'Industrial' },
    { value: 'PARKING', label: 'Parking' },
    { value: 'STORAGE', label: 'Trastero' },
    { value: 'ROOM', label: 'Habitación' },
    { value: 'LAND', label: 'Terreno' }
  ];
  
  selectedTypeFilter = signal<string>('ALL');

  filteredProperties = computed(() => {
    const filter = this.selectedTypeFilter();
    const list = this.properties();
    if (filter === 'ALL') return list;
    return list.filter(p => p.type === filter);
  });

  ngOnInit() {
    this.loadProperties();
  }

  async loadProperties() {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(
        propertyControllerFindAll(this.http, this.config.rootUrl, {})
      );
      // Extraemos el array de la respuesta
      const data = (response as any).body ?? response;
      this.properties.set(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error cargando inmuebles:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteProperty(id: string) {
    if (!confirm('¿Seguro que quieres borrar este inmueble?')) return;
    try {
      await firstValueFrom(
        propertyControllerRemove(this.http, this.config.rootUrl, { id })
      );
      await this.loadProperties();
    } catch (error) {
      alert('No se pudo borrar. Verifica dependencias.');
    }
  }
}