import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Cliente } from '@clientes/shared';

export interface ClientesResponse {
  items: Cliente[];
  total: number;
  page: number;
  limit: number;
}

export interface Pais {
  codigo: string;
  nombre: string;
}

export interface Comercial {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClientesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/clientes';

  getClientes(page = 1, limit = 20, search = '', estado = '', pais = '', comercial = '') {
    return this.http.get<ClientesResponse>(this.apiUrl, {
      params: {
        page,
        limit,
        search,
        estado,
        pais,
        comercial,
      },
    });
  }

  getPaises() {
    return this.http.get<Pais[]>('http://localhost:3000/api/paises');
  }

  getComerciales() {
    return this.http.get<Comercial[]>('http://localhost:3000/api/comerciales');
  }
}
