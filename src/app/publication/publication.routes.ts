import { Routes } from '@angular/router';

export default [
  // Rutas para ofertas de trabajo
  {
    path: 'job-offers',
    loadComponent: () =>
      import('./features/publication-demand/publication-demand.component'),
  },
  {
    path: 'create-job-offer',
    loadComponent: () =>
      import('./features/publication-demand/publication-demand.component'),
  },
  {
    path: 'job/:id',
    loadComponent: () =>
      import('./features/publication-demand/publication-demand.component'),
  },
  {
    path: 'job/:id/edit',
    loadComponent: () =>
      import('./features/publication-demand/publication-demand.component'),
  },
  // Rutas para personas que ofrecen sus servicios
  {
    path: 'service-offers',
    loadComponent: () =>
      import('./features/publication-offers/publication-offers.component'),
  },
  {
    path: 'create-service-offer',
    loadComponent: () =>
      import('./features/publication-demand/publication-demand.component'),
  },
  {
    path: 'service/:id',
    loadComponent: () =>
      import('./features/publication-demand/publication-demand.component'),
  },
  {
    path: 'services:id/edit',
    loadComponent: () =>
      import('./features/publication-demand/publication-demand.component'),
  },
  {
    path: '',
    redirectTo: 'job-offers',
    pathMatch: 'full',
  },
] as Routes;
