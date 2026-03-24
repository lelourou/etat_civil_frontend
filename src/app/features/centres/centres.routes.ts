import { Routes } from '@angular/router';
export const centresRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./centres-list.component').then(m => m.CentresListComponent),
  },
];
