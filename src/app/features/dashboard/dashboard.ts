import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
})
export class DashboardComponent {
  // Hacemos pública la sesión para saludar al usuario en el HTML
  public session = inject(SessionService);

  // --- DATOS MOCK (Falsos para diseño) ---
  
  // 1. KPIs (Los números gordos de arriba)
  stats = signal([
    { title: 'Ingresos este mes', value: '4.250 €', trend: '+12%', color: 'text-green-600', bg: 'bg-green-50', icon: '💰' },
    { title: 'Propiedades', value: '12', subtext: '2 vacías', color: 'text-blue-600', bg: 'bg-blue-50', icon: '🏢' },
    { title: 'Ocupación', value: '85%', subtext: 'Estable', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: '📊' },
    { title: 'Incidencias', value: '3', subtext: '1 Urgente', color: 'text-orange-600', bg: 'bg-orange-50', icon: '⚠️' },
  ]);

  // 2. Lista de tareas pendientes o alertas
  pendingTasks = signal([
    { id: 1, title: 'Renovación contrato - Piso Centro', date: 'Vence en 5 días', status: 'warning' },
    { id: 2, title: 'Pago pendiente - Local 4B', date: 'Vencido ayer', status: 'danger' },
    { id: 3, title: 'Revisión gas - Ático A', date: 'Programado 24 Ene', status: 'info' },
  ]);

  // 3. Accesos directos a acciones frecuentes
  quickActions = [
    { label: 'Nueva Propiedad', route: '/app/properties/new', icon: '🏠' },
    { label: 'Nuevo Contrato', route: '/app/contracts/new', icon: '📄' },
    { label: 'Registrar Cobro', route: '/app/payments/new', icon: '💶' },
  ];
}