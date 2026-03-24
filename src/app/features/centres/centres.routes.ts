import { Routes } from '@angular/router';

export const centresRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./centres-list.component').then(m => m.CentresListComponent),
  },
  {
    path: 'nouveau',
    loadComponent: () =>
      import('./centre-form.component').then(m => m.CentreFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./centre-detail.component').then(m => m.CentreDetailComponent),
  },
  {
    path: ':id/modifier',
    loadComponent: () =>
      import('./centre-form.component').then(m => m.CentreFormComponent),
  },
];
