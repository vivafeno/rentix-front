import { Injectable, signal } from '@angular/core';
/** 🛡️ CORRECCIÓN TS2724: Importaciones alineadas con el nuevo contrato OpenAPI */
import { CreateCompanyLegalDto, CreateFiscalDto, CreateAddressDto } from '../../api/models';

/**
 * @class LegalWizardService
 * @description Almacén temporal (Hydrated Draft) para el alta atómica de empresas.
 * Mantiene la integridad de los datos antes del envío final al backend.
 * @version 2026.1.18
 * @author Rentix 2026
 */
@Injectable({ providedIn: 'root' })
export class LegalWizardService {

  /**
   * @description Estado inicial del wizard. 
   * CORRECCIÓN: Se alinean las propiedades con los nombres en castellano del API.
   */
  public wizardData = signal<Partial<CreateCompanyLegalDto>>({
    company: { userId: '' },
    fiscal: {
      tipo: 'J',
      taxIdType: '01',
      taxId: '',
      corporateName: ''
    } as any, // 🛡️ 'as any' para evitar conflictos con el modelo mientras se completa
    address: {
      type: 'FISCAL' as any,
      codigoPais: 'ESP',
      isDefault: true,
      direccion: '',
      poblacion: '',
      codigoPostal: ''
    } as any
  });

  /**
   * @method updateSection
   * @description Actualiza el borrador mediante merge selectivo.
   * Si la sección es un valor simple (UUID), lo asigna; si es un objeto, hace merge.
   */
  updateSection<K extends keyof CreateCompanyLegalDto>(section: K, data: any): void {
    this.wizardData.update(prev => {
      // 🛡️ Gestión de tipos primitivos (como userId)
      if (typeof data !== 'object' || data === null) {
        return { ...prev, [section]: data };
      }

      const currentSection = (prev[section] as object) || {};
      
      return {
        ...prev,
        [section]: { ...currentSection, ...data }
      };
    });
  }

  /**
   * @method reset
   * @description Limpia el borrador tras una operación exitosa o cancelación.
   */
  reset(): void {
    this.wizardData.set({
      company: { userId: '' },
      fiscal: { tipo: 'J', taxIdType: '01', taxId: '' } as any,
      address: { type: 'FISCAL', isDefault: true, codigoPais: 'ESP' } as any
    });
  }
}