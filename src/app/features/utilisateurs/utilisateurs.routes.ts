import { Routes } from '@angular/router';

export const utilisateursRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./utilisateurs-list.component').then(m => m.UtilisateursListComponent),
  },
  {
    path: 'nouveau',
    loadComponent: () => import('./utilisateur-form.component').then(m => m.UtilisateurFormComponent),
  },
  {
    path: ':id/modifier',
    loadComponent: () => import('./utilisateur-form.component').then(m => m.UtilisateurFormComponent),
  },
];
