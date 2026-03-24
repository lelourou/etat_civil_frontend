import { Routes } from '@angular/router';
export const actesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./actes-list.component').then(m => m.ActesListComponent),
  },
];
