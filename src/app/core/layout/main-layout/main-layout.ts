import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionService } from '../../services/session.service'; // Ajusta la ruta si es necesario

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive], // Solo lo que usamos en el HTML
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayoutComponent {
  // Inyección de dependencias moderna
  private _router = inject(Router);
  public session = inject(SessionService); // Público para usarlo en el HTML

  // Definición del menú (Signal no es obligatorio para constantes, pero es buena práctica en v21)
  menuItems = signal([
    { label: 'Dashboard', icon: '📊', route: '/app/dashboard' },
    { label: 'Inmuebles', icon: '🏠', route: '/app/properties' }, // 🏠 Icono casa
    { label: 'Contratos', icon: '📄', route: '/app/contracts' },
    { label: 'Clientes', icon: '👥', route: '/app/clients' },
    { label: 'Impuestos', icon: '💰', route: '/app/taxes' },
    { label: 'Configuración', icon: '⚙️', route: '/app/settings' }, // ⚙️ Icono engranaje
  ]);

  logout() {
    this.session.logout();
  }

  changeCompany() {
    this._router.navigate(['/select-company']);
  }
}