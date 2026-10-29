import { Routes } from '@angular/router';
import { ClientesListComponent } from './pages/clientes-list/clientes-list.component';

export const routes: Routes = [
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
