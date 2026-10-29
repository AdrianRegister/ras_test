import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Cliente } from '@clientes/shared';

export interface ClientesResponse {
  items: Cliente[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root',
})
export class ClientesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/clientes';

  getClientes(page = 1, limit = 20, search = '') {
    return this.http.get<ClientesResponse>(this.apiUrl, {
      params: { page, limit, search },
    });
  }
}
