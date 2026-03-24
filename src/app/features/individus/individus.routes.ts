import { Routes } from '@angular/router';

export const individusRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./individus-list.component').then(m => m.IndividusListComponent),
  },
  {
    path: 'nouveau',
    loadComponent: () => import('./individu-form.component').then(m => m.IndividuFormComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./individu-detail.component').then(m => m.IndividuDetailComponent),
  },
];
