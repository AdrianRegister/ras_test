import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface LoginResponse {
  message: string;
  usuario: {
    id: number;
    nombre: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/users';

  login(nombre: string, password: string) {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      { nombre, password },
      { withCredentials: true },
    );
  }

  logout() {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/logout`,
      {},
      { withCredentials: true },
    );
  }

  isLoggedIn(): boolean {
    return sessionStorage.getItem('usuario') !== null;
  }
}
