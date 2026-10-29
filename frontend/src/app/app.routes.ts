import { Routes } from '@angular/router';
import { ClientesListComponent } from './pages/clientes-list/clientes-list.component';
import { LoginComponent } from './pages/login/login.component';
import { ClienteDetailComponent } from './clientes/cliente-detail/cliente-detail.component';
import { ClienteFormComponent } from './clientes/cliente-form/cliente-form.component';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'clientes/nuevo',
    component: ClienteFormComponent,
    canActivate: [authGuard],
  },
  {
    path: 'clientes/:id/editar',
    component: ClienteFormComponent,
    canActivate: [authGuard],
  },
  {
    path: 'clientes/:id',
    component: ClienteDetailComponent,
    canActivate: [authGuard],
  },
  {
    path: 'clientes',
    component: ClientesListComponent,
    canActivate: [authGuard],
  },
  { path: '', pathMatch: 'full', redirectTo: 'clientes' },
  { path: '**', redirectTo: 'clientes' },
];
