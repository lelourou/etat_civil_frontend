import { Routes } from '@angular/router';
export const individusRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./individus-list.component').then(m => m.IndividusListComponent),
  },
];
