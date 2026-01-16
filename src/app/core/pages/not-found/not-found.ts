import { Component, inject } from '@angular/core';
import { Router } from '@angular/router'; // 👈 Quitamos RouterLink, usamos Router
import { SessionService } from '../../services/session.service'; // Asegura que la ruta sea correcta

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [], // Ya no necesitamos RouterLink en los imports
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss'
})
export class NotFoundComponent {
  private router = inject(Router);
  private session = inject(SessionService);

  goHome() {
    // Lógica Inteligente:
    if (this.session.user()) {
      // Si ya estoy dentro...
      if (this.session.currentCompany()) {
        this.router.navigate(['/app/dashboard']); // ...y tengo empresa -> Dashboard
      } else {
        this.router.navigate(['/select-company']); // ...pero no tengo empresa -> Selección
      }
    } else {
      // Si soy un fantasma -> Login
      this.router.navigate(['/login']);
    }
  }
}