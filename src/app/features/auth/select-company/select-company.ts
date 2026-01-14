import { Component, inject, computed } from '@angular/core'; // 👈 Asegúrate de importar computed
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
  session = inject(SessionService);
  private router = inject(Router);

  // 👇 ESTA ES LA VARIABLE QUE FALTABA
  isSuperAdmin = computed(() => {
    const user = this.session.user();
    // Verificamos si existe el usuario y si tiene el rol SUPERADMIN
    return user?.appRole?.includes('SUPERADMIN') ?? false;
  });

  onSelect(companyId: string) {
    this.session.selectCompany(companyId);
  }
  
  goToCreateCompany() {
    this.router.navigate(['/create-company']);
  }
  
  logout() {
    this.session.logout();
  }
}