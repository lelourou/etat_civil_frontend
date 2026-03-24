import { Routes } from '@angular/router';

export const actesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./actes-list.component').then(m => m.ActesListComponent),
  },
  {
    path: 'nouveau',
    loadComponent: () => import('./acte-form.component').then(m => m.ActeFormComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./acte-detail.component').then(m => m.ActeDetailComponent),
  },
];
