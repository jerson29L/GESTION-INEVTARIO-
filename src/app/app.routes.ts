import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { LoginComponent } from './login/login';
import { AuthService } from './services/auth.service';

const authGuard = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (auth.isLoggedIn()) {
    return true;
  }

  router.navigate(['']);
  return false;
};

// Si ya estás logueado y entras a la raíz '', redirige al dashboard
const redirectIfLoggedIn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  if (auth.isLoggedIn()) {
    router.navigate(['/admin/dashboard']);
    return false;
  }
  return true; // permite ver Login si no está logueado
};

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
    canActivate: [redirectIfLoggedIn]
  },
  {
    path: 'admin',
    loadChildren: () => import('./dashboard/dashboard.routes').then(m => m.dashboard_routes), 
    canActivate: [authGuard] 
  },
  {
    path: '**', 
    redirectTo: '',
    pathMatch: 'full'
  }
];
