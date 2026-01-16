import { Component, inject, signal, OnInit, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PropertyService } from '../../../core/services/property.service';
import { SessionService } from '../../../core/services/session.service';
import { Property } from '../../../api/models';
import { PropertyFormComponent } from '../property-form/property-form.component';

interface PropertyFilters {
  search: string;
  type: string;
  city: string;
}

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PropertyFormComponent],
  templateUrl: './property-list.html'
})
export class PropertyListComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  public readonly session = inject(SessionService);

  @ViewChild(PropertyFormComponent) propertyForm!: PropertyFormComponent;

  // --- Estado Reacivo (Signals) ---
  public properties = signal<Property[]>([]);
  public isLoading = signal(false);
  public isTrashMode = signal<boolean>(false);
  
  public filters = signal<PropertyFilters>({
    search: '',
    type: 'ALL',
    city: ''
  });

  public readonly availableTypes = [
    { value: 'RESIDENTIAL', label: 'Residencial' },
    { value: 'COMMERCIAL', label: 'Comercial' },
    { value: 'INDUSTRIAL', label: 'Industrial' },
    { value: 'PARKING', label: 'Parking' },
    { value: 'STORAGE', label: 'Trastero' },
    { value: 'ROOM', label: 'Habitación' },
    { value: 'LAND', label: 'Terreno' }
  ];

  /**
   * Lógica de filtrado optimizada.
   * Aplica normalización de caracteres para ignorar acentos en la búsqueda de ciudad.
   */
  public filteredProperties = computed(() => {
    const list = this.properties() || [];
    const f = this.filters();

    return list.filter(p => {
      // 1. Filtro por Tipo
      const matchType = f.type === 'ALL' || p.type === f.type;
      
      // 2. Filtro por Búsqueda (Nombre o Referencia)
      const matchSearch = !f.search || 
        p.name.toLowerCase().includes(f.search.toLowerCase()) || 
        p.internalCode?.toLowerCase().includes(f.search.toLowerCase());
      
      // 3. Filtro por Ciudad (Normalización de tildes y control de nulos)
      const matchCity = !f.city || this.normalizeText(p.address?.city || '')
        .includes(this.normalizeText(f.city));

      return matchType && matchSearch && matchCity;
    });
  });

  ngOnInit(): void {
    this.loadProperties();
  }

  /**
   * Carga de datos desde el servicio según el estado de la vista (Activos/Papelera).
   */
  async loadProperties(): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = this.isTrashMode() 
        ? await this.propertyService.findTrash() 
        : await this.propertyService.findAll();
      this.properties.set(data || []);
    } catch (error) {
      console.error('Data Fetch Error:', error);
      this.properties.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  public updateFilter(key: keyof PropertyFilters, value: string): void {
    this.filters.update(prev => ({ ...prev, [key]: value }));
  }

  public toggleTrashView(): void {
    this.isTrashMode.update(val => !val);
    this.loadProperties();
  }

  public editProperty(prop: Property): void {
    if (this.isTrashMode()) return;
    this.propertyForm?.open(prop);
  }

  async deleteProperty(id: string): Promise<void> {
    if (!confirm('¿Confirmar traslado a la papelera?')) return;
    try {
      await this.propertyService.remove(id);
      await this.loadProperties();
    } catch (error) {
      console.error('Delete Error:', error);
    }
  }

  async onRestore(id: string): Promise<void> {
    try {
      await this.propertyService.restore(id);
      await this.loadProperties();
    } catch (error) {
      console.error('Restore Error:', error);
    }
  }

  /**
   * Helper para normalizar texto: minúsculas y eliminación de diacríticos (acentos).
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }
}