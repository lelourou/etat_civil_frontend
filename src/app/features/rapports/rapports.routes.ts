import { Routes } from '@angular/router';

export const rapportsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./rapports-bi.component').then(m => m.RapportsBiComponent),
  },
];
