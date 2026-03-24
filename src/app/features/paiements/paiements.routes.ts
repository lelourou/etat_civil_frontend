import { Routes } from '@angular/router';

export const paiementsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./paiements-list.component').then(m => m.PaiementsListComponent),
  },
];
