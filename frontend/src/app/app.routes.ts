import { Routes } from '@angular/router';
import { ClientesListComponent } from './pages/clientes-list/clientes-list.component';
import { ClienteDetailComponent } from './clientes/cliente-detail/cliente-detail.component';
import { ClienteFormComponent } from './clientes/cliente-form/cliente-form.component';

export const routes: Routes = [
  { path: 'clientes/nuevo', component: ClienteFormComponent },
  { path: 'clientes/:id/editar', component: ClienteFormComponent },
  { path: 'clientes/:id', component: ClienteDetailComponent },
  { path: 'clientes', component: ClientesListComponent },
  { path: '', pathMatch: 'full', redirectTo: 'clientes' },
  { path: '**', redirectTo: 'clientes' },
];
