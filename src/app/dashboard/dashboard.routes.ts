import { Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { Categorias } from './categorias/categorias';
import { DashboardComponent } from './dashboard/dashboard';
import { ProductosComponent } from './productos/productos';
import { SalidasComponent } from './salidas/salidas';
import { IncidenciasComponent } from './incidencias/incidencias';
import { UsuariosComponent } from './usuarios/usuarios';

export const dashboard_routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'categorias', component: Categorias },
      { path: 'productos', component: ProductosComponent },
      { path: 'salidas', component: SalidasComponent },
      { path: 'incidencias', component: IncidenciasComponent },
      { path: 'usuarios', component: UsuariosComponent }, 
    ],
  },
];
