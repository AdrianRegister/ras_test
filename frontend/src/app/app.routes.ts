import { Routes } from '@angular/router';
import { ClientesListComponent } from './pages/clientes-list/clientes-list.component';
import { ClienteDetailComponent } from './clientes/cliente-detail/cliente-detail.component';

export const routes: Routes = [
  {
    path: 'clientes/:id',
    component: ClienteDetailComponent,
  },
  {
    path: 'clientes',
    component: ClientesListComponent,
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'clientes',
  },
  {
    path: '**',
    redirectTo: 'clientes',
  },
];
