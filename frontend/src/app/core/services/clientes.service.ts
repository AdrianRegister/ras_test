import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Cliente, ClienteDetalle, HistoricoCambio } from '@clientes/shared';

export interface ClientesResponse {
  items: Cliente[];
  total: number;
  page: number;
  limit: number;
}

export interface Pais {
  id: number;
  codigo: string;
  nombre: string;
}

export interface Comercial {
  id: number;
  nombre: string;
}

export interface Estado {
  id: number;
  nombre: 'Activo' | 'Inactivo';
}

export interface ClientePayload {
  empresa: string;
  cif: string;
  pais_id: number;
  estado_id: number;
  direccion?: string | null;
  codigo_postal?: string | null;
  ciudad?: string | null;
  comercial_id?: number | null;
  fecha_alta?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ClientesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/clientes';

  getClientes(page = 1, limit = 20, search = '', estado = '', pais = '', comercial = '') {
    return this.http.get<ClientesResponse>(this.apiUrl, {
      withCredentials: true,
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

  getHistorico(id: number) {
    return this.http.get<HistoricoCambio[]>(`${this.apiUrl}/${id}/historico`, {
      withCredentials: true,
    });
  }

  getCliente(id: number) {
    return this.http.get<ClienteDetalle>(`${this.apiUrl}/${id}`, {
      withCredentials: true,
    });
  }

  getPaises() {
    return this.http.get<Pais[]>('http://localhost:3000/api/paises', {
      withCredentials: true,
    });
  }

  getEstados() {
    return this.http.get<Estado[]>('http://localhost:3000/api/estados', {
      withCredentials: true,
    });
  }

  getComerciales() {
    return this.http.get<Comercial[]>('http://localhost:3000/api/comerciales', {
      withCredentials: true,
    });
  }

  crearCliente(datos: ClientePayload) {
    return this.http.post<ClienteDetalle>(this.apiUrl, datos, {
      withCredentials: true,
    });
  }

  actualizarCliente(id: number, datos: ClientePayload) {
    return this.http.put<ClienteDetalle>(`${this.apiUrl}/${id}`, datos, {
      withCredentials: true,
    });
  }

  eliminarCliente(id: number) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, {
      withCredentials: true,
    });
  }
}
