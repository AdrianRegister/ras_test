import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Cliente } from '@clientes/shared';
import { ClientesService } from '../../core/services/clientes.service';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './clientes-list.component.html',
  styleUrl: './clientes-list.component.css',
})
export class ClientesListComponent implements OnInit {
  private readonly clientesService = inject(ClientesService);

  clientes: Cliente[] = [];
  cargando = true;
  error = '';
  busqueda = '';
  private temporizadorBusqueda?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.cargarClientes();
  }

  onSearch(value: string): void {
    this.busqueda = value;

    clearTimeout(this.temporizadorBusqueda);

    this.temporizadorBusqueda = setTimeout(() => {
      this.cargarClientes();
    }, 300);
  }

  cargarClientes(): void {
    this.cargando = true;
    this.error = '';

    this.clientesService.getClientes(1, 20, this.busqueda).subscribe({
      next: (respuesta: any) => {
        this.clientes = respuesta.items;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
        this.error = 'No se han podido cargar los clientes.';
        this.cargando = false;
      },
    });
  }
}
