import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ClienteDetalle } from '@clientes/shared';
import {
  ClientesService,
  ClientePayload,
  Pais,
  Comercial,
  Estado,
} from '../../core/services/clientes.service';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cliente-form.component.html',
  styleUrl: './cliente-form.component.css',
})
export class ClienteFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientesService = inject(ClientesService);

  clienteId: number | null = null;
  editando = false;
  cargando = false;
  guardando = false;
  error = '';

  paises: Pais[] = [];
  comerciales: Comercial[] = [];
  estados: Estado[] = [];

  formulario = {
    empresa: '',
    cif: '',
    pais_id: 0,
    estado_id: 0,
    direccion: '',
    codigo_postal: '',
    ciudad: '',
    comercial_id: null as number | null,
    fecha_alta: '',
  };

  ngOnInit(): void {
    this.cargarOpciones();

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam !== null) {
      const id = Number(idParam);

      if (!Number.isInteger(id) || id <= 0) {
        this.error = 'El identificador del cliente no es válido.';
        return;
      }

      this.clienteId = id;
      this.editando = true;
      this.cargarCliente(id);
    }
  }

  private cargarOpciones(): void {
    this.clientesService.getPaises().subscribe({
      next: (paises) => {
        this.paises = paises;
      },
      error: () => {
        this.error = 'No se han podido cargar los países.';
      },
    });

    this.clientesService.getComerciales().subscribe({
      next: (comerciales) => {
        this.comerciales = comerciales;
      },
      error: () => {
        this.error = 'No se han podido cargar los comerciales.';
      },
    });

    this.clientesService.getEstados().subscribe({
      next: (estados) => {
        this.estados = estados;
      },
      error: () => {
        this.error = 'No se han podido cargar los estados.';
      },
    });
  }

  private cargarCliente(id: number): void {
    this.cargando = true;

    this.clientesService.getCliente(id).subscribe({
      next: (cliente) => {
        this.formulario = {
          empresa: cliente.empresa,
          cif: cliente.cif ?? '',
          pais_id: this.paises.find((pais) => pais.codigo === cliente.paisCodigo)?.id ?? 0,
          estado_id: this.estados.find((estado) => estado.nombre === cliente.estado)?.id ?? 0,
          direccion: cliente.direccion ?? '',
          codigo_postal: cliente.codigoPostal ?? '',
          ciudad: cliente.ciudad,
          comercial_id: cliente.comercialId,
          fecha_alta: cliente.fechaAlta.slice(0, 10),
        };

        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar el cliente:', err);
        this.error = 'No se ha podido cargar el cliente.';
        this.cargando = false;
      },
    });
  }

  guardar(): void {
    if (
      !this.formulario.empresa.trim() ||
      !this.formulario.cif.trim() ||
      this.formulario.pais_id <= 0 ||
      this.formulario.estado_id <= 0
    ) {
      this.error = 'Completa la empresa, el CIF, el país y el estado.';
      return;
    }

    const datos: ClientePayload = {
      empresa: this.formulario.empresa.trim(),
      cif: this.formulario.cif.trim(),
      pais_id: Number(this.formulario.pais_id),
      estado_id: Number(this.formulario.estado_id),
      direccion: this.formulario.direccion.trim() || null,
      codigo_postal: this.formulario.codigo_postal.trim() || null,
      ciudad: this.formulario.ciudad.trim() || null,
      comercial_id:
        this.formulario.comercial_id === null ? null : Number(this.formulario.comercial_id),
      fecha_alta: this.formulario.fecha_alta || null,
    };

    this.guardando = true;
    this.error = '';

    const peticion =
      this.clienteId === null
        ? this.clientesService.crearCliente(datos)
        : this.clientesService.actualizarCliente(this.clienteId, datos);

    peticion.subscribe({
      next: (cliente: ClienteDetalle) => {
        this.router.navigate(['/clientes', cliente.id]);
      },
      error: (err) => {
        console.error('Error al guardar el cliente:', err);
        this.error =
          err.error?.details?.[0]?.message ??
          err.error?.error ??
          'No se ha podido guardar el cliente.';
        this.guardando = false;
      },
    });
  }
}
