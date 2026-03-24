import { Routes } from '@angular/router';

export const notificationsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./notifications-list.component').then(m => m.NotificationsListComponent),
  },
];
