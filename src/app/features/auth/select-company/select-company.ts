import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-select-company',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-company.html'
})
export class SelectCompanyComponent {
  public session = inject(SessionService); 
  private router = inject(Router);

  isSuperAdmin = computed(() => {
    // Verificamos el rol correctamente
    return this.session.user()?.appRole === 'SUPERADMIN'; 
  });

  onSelect(companyId: string) {
    // El servicio se encarga de la navegación al Dashboard
    this.session.selectCompany(companyId); 
  }
  
  goToCreateCompany() {
    // 🚨 CORRECCIÓN: La ruta en app.routes.ts es 'create-company'
    this.router.navigate(['/create-company']); 
  }
  
  logout() {
    this.session.logout();
    // Nota: El SessionService.logout() ya redirige al login, 
    // pero dejar esto aquí no rompe nada.
  }
}