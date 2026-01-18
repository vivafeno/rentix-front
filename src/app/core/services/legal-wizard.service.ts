import { Injectable, signal } from '@angular/core';
import { CreateCompanyLegalDto, CreateFiscalEntityDto, CreateAddressDto } from '../../api/models';

/**
 * @description Almacén temporal (Hydrated Draft) para el alta atómica de empresas.
 * Mantiene la integridad de los datos antes del envío final al backend.
 * @version 2026.1.17
 */
@Injectable({ providedIn: 'root' })
export class LegalWizardService {

    /**
     * @description Estado inicial del wizard. 
     * Se inicializa como Partial para permitir el llenado por pasos.
     */
    public wizardData = signal<Partial<CreateCompanyLegalDto>>({
        company: { userId: '' },
        fiscal: {
            personType: 'J',
            taxIdType: '01',
            countryCode: 'ESP',
            taxId: '' // 👈 Añadimos taxId vacío para satisfacer el contrato del DTO
        } as CreateFiscalEntityDto, // Forzamos el tipo para evitar errores de propiedades faltantes
        address: {
            type: 'FISCAL',
            countryCode: 'ESP',
            isDefault: true,
            addressLine1: '',
            city: '',
            postalCode: ''
        } as CreateAddressDto
    });

    /**
     * @description Actualiza el borrador. Si la sección es un objeto, hace merge.
     * Si es un valor simple (como userId), lo asigna directamente.
     */
    updateSection<K extends keyof CreateCompanyLegalDto>(section: K, data: any): void {
        this.wizardData.update(prev => {
            // Si el dato es un string (como el UUID), no podemos hacer spread
            if (typeof data !== 'object' || data === null) {
                return { ...prev, [section]: data };
            }

            const currentSection = prev[section] || {};
            return {
                ...prev,
                [section]: { ...currentSection, ...data }
            };
        });
    }

    /**
     * @description Limpia el borrador tras una operación exitosa.
     */
    reset(): void {
        this.wizardData.set({
            company: { userId: '' },
            fiscal: { personType: 'J', taxIdType: '01', taxId: '' } as any,
            address: { type: 'FISCAL', isDefault: true } as any
        });
    }
}