import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Cliente } from '@clientes/shared';
import { ClientesService, Pais, Comercial } from '../../core/services/clientes.service';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './clientes-list.component.html',
  styleUrl: './clientes-list.component.css',
})
export class ClientesListComponent implements OnInit {
  private readonly clientesService = inject(ClientesService);

  clientes: Cliente[] = [];
  paises: Pais[] = [];
  comerciales: Comercial[] = [];
  cargando = true;
  error = '';
  busqueda = '';
  private temporizadorBusqueda?: ReturnType<typeof setTimeout>;
  estadoSeleccionado = '';
  paisSeleccionado = '';
  comercialSeleccionado = '';

  ngOnInit(): void {
    this.cargarFiltros();
    this.cargarClientes();
  }

  onFilterChange(): void {
    this.cargarClientes();
  }

  onSearch(value: string): void {
    this.busqueda = value;

    clearTimeout(this.temporizadorBusqueda);

    this.temporizadorBusqueda = setTimeout(() => {
      this.cargarClientes();
    }, 300);
  }

  cargarFiltros(): void {
    this.clientesService.getPaises().subscribe({
      next: (paises) => {
        this.paises = paises;
      },
      error: (err) => {
        console.error('Error al cargar países:', err);
      },
    });

    this.clientesService.getComerciales().subscribe({
      next: (comerciales) => {
        this.comerciales = comerciales;
      },
      error: (err) => {
        console.error('Error al cargar comerciales:', err);
      },
    });
  }

  cargarClientes(): void {
    this.cargando = true;
    this.error = '';

    this.clientesService
      .getClientes(
        1,
        20,
        this.busqueda,
        this.estadoSeleccionado,
        this.paisSeleccionado,
        this.comercialSeleccionado,
      )
      .subscribe({
        next: (respuesta) => {
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
