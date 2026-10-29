import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  get mostrarCabecera(): boolean {
    return this.authService.isLoggedIn() && this.router.url !== '/login';
  }

  cerrarSesion(): void {
    this.authService.logout().subscribe({
      next: () => {
        sessionStorage.removeItem('usuario');
        this.router.navigate(['/login']);
      },
      error: () => {
        // Even if the API call fails, clear local state and return to login.
        sessionStorage.removeItem('usuario');
        this.router.navigate(['/login']);
      },
    });
  }
}
