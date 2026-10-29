import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClienteDetalle, HistoricoCambio } from '@clientes/shared';
import { ClientesService } from '../../core/services/clientes.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cliente-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cliente-detail.component.html',
  styleUrl: './cliente-detail.component.css',
})
export class ClienteDetailComponent implements OnInit {
  private router = new Router();
  private readonly route = inject(ActivatedRoute);
  private readonly clientesService = inject(ClientesService);

  cliente: ClienteDetalle | null = null;
  historico: HistoricoCambio[] = [];
  cargando = true;
  error = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.error = 'El identificador del cliente no es válido.';
      this.cargando = false;
      return;
    }

    this.cargarCliente(id);
    this.cargarHistorico(id);
  }

  private cargarCliente(id: number): void {
    this.clientesService.getCliente(id).subscribe({
      next: (cliente) => {
        this.cliente = cliente;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar el cliente:', err);
        this.error = 'No se ha podido cargar la ficha del cliente.';
        this.cargando = false;
      },
    });
  }

  private cargarHistorico(id: number): void {
    this.clientesService.getHistorico(id).subscribe({
      next: (historico) => {
        this.historico = [...historico].sort(
          (a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime(),
        );
      },
      error: (err) => {
        console.error('Error al cargar el histórico:', err);
      },
    });
  }

  eliminarCliente(): void {
    if (this.cliente === null) {
      return;
    }

    const confirmar = window.confirm(
      `¿Seguro que quieres eliminar el cliente "${this.cliente.empresa}"?`,
    );

    if (!confirmar) {
      return;
    }

    this.clientesService.eliminarCliente(this.cliente.id).subscribe({
      next: () => {
        this.router.navigate(['/clientes']);
      },
      error: (err) => {
        console.error('Error al eliminar el cliente:', err);
        this.error = 'No se ha podido eliminar el cliente.';
      },
    });
  }
}
