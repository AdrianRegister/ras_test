import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  nombre = '';
  password = '';
  error = '';
  cargando = false;

  entrar(): void {
    this.error = '';
    this.cargando = true;

    this.authService.login(this.nombre, this.password).subscribe({
      next: (response) => {
        sessionStorage.setItem('usuario', JSON.stringify(response.usuario));
        this.router.navigate(['/clientes']);
      },
      error: (err) => {
        this.error = err.error?.error ?? 'No se ha podido iniciar sesión.';
        this.cargando = false;
      },
    });
  }
}
