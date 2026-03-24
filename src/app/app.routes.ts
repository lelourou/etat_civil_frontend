import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Auth (public)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes),
  },

  // Pages protégées
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'actes',
        loadChildren: () => import('./features/actes/actes.routes').then(m => m.actesRoutes),
      },
      {
        path: 'individus',
        loadChildren: () => import('./features/individus/individus.routes').then(m => m.individusRoutes),
      },
      {
        path: 'centres',
        canActivate: [roleGuard(['SUPERVISEUR_NATIONAL', 'ADMIN_SYSTEME'])],
        loadChildren: () => import('./features/centres/centres.routes').then(m => m.centresRoutes),
      },
      {
        path: 'paiements',
        loadChildren: () => import('./features/paiements/paiements.routes').then(m => m.paiementsRoutes),
      },
      {
        path: 'notifications',
        loadChildren: () => import('./features/notifications/notifications.routes').then(m => m.notificationsRoutes),
      },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
