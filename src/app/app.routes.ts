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

      // ── AGENT_CENTRE uniquement ─────────────────────────────────────────
      {
        path: 'actes',
        canActivate: [roleGuard(['AGENT_CENTRE'])],
        loadChildren: () => import('./features/actes/actes.routes').then(m => m.actesRoutes),
      },
      {
        path: 'individus',
        canActivate: [roleGuard(['AGENT_CENTRE'])],
        loadChildren: () => import('./features/individus/individus.routes').then(m => m.individusRoutes),
      },
      {
        path: 'paiements',
        canActivate: [roleGuard(['AGENT_CENTRE'])],
        loadChildren: () => import('./features/paiements/paiements.routes').then(m => m.paiementsRoutes),
      },
      {
        path: 'notifications',
        canActivate: [roleGuard(['AGENT_CENTRE'])],
        loadChildren: () => import('./features/notifications/notifications.routes').then(m => m.notificationsRoutes),
      },
      {
        path: 'rapports',
        canActivate: [roleGuard(['AGENT_CENTRE'])],
        loadChildren: () => import('./features/rapports/rapports.routes').then(m => m.rapportsRoutes),
      },

      // ── ADMIN_CENTRAL uniquement ────────────────────────────────────────
      {
        path: 'centres',
        canActivate: [roleGuard(['ADMIN_CENTRAL'])],
        loadChildren: () => import('./features/centres/centres.routes').then(m => m.centresRoutes),
      },
      {
        path: 'utilisateurs',
        canActivate: [roleGuard(['ADMIN_CENTRAL'])],
        loadChildren: () => import('./features/utilisateurs/utilisateurs.routes').then(m => m.utilisateursRoutes),
      },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
