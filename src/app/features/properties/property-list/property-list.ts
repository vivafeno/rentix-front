import { Component, inject, signal, OnInit, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PropertyService } from '../../../core/services/property.service';
import { SessionService } from '../../../core/services/session.service';
import { Property } from '../../../api/models';
import { PropertyFormComponent } from '../property-form/property-form.component';

/**
 * Dashboard de gestión de inventario inmobiliario.
 * Utiliza Signals para una reactividad de alto rendimiento.
 */
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

  public properties = signal<Property[]>([]);
  public isLoading = signal(false);
  public activeTab = signal<'active' | 'trash'>('active');
  
  public filters = signal({
    search: '',
    type: 'ALL',
    city: ''
  });

  public readonly availableTypes = [
    { value: 'RESIDENTIAL', label: 'Residencial' },
    { value: 'COMMERCIAL', label: 'Comercial' },
    { value: 'INDUSTRIAL', label: 'Industrial' }
  ];

  /**
   * Filtrado en memoria basado en Signals.
   */
  public filteredProperties = computed(() => {
    const list = this.properties() || [];
    const f = this.filters();

    return list.filter(p => {
      const matchType = f.type === 'ALL' || p.type === f.type;
      const searchLower = f.search.toLowerCase();
      const matchSearch = !f.search || 
        p.internalCode?.toLowerCase().includes(searchLower) || 
        p.cadastralReference?.toLowerCase().includes(searchLower);
      
      const matchCity = !f.city || this.normalizeText(p.address?.city || '')
        .includes(this.normalizeText(f.city));

      return matchType && matchSearch && matchCity;
    });
  });

  ngOnInit(): void {
    this.loadProperties();
  }

  /**
   * Carga los activos según la pestaña seleccionada.
   */
  async loadProperties(): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = this.activeTab() === 'trash'
        ? await this.propertyService.findTrash() 
        : await this.propertyService.findAll();
      this.properties.set(data || []);
    } catch (error) {
      console.error('Fetch Error:', error);
      this.properties.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Cambia entre vista activa y papelera.
   */
  public toggleTab(tab: 'active' | 'trash'): void {
    this.activeTab.set(tab);
    this.loadProperties();
  }

  public editProperty(prop: Property): void {
    if (this.activeTab() === 'trash') return;
    this.propertyForm?.open(prop);
  }

  async deleteProperty(id: string): Promise<void> {
    if (!confirm('¿Mover a la papelera?')) return;
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

  private normalizeText(text: string): string {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
}