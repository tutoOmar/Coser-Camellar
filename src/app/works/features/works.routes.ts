import { Routes } from '@angular/router';

export default [
  {
    path: 'costureros',
    loadComponent: () => import('./costureros/costureros.component'),
  },
  {
    path: 'patinadores',
    loadComponent: () => import('./patinadores/patinadores.component'),
  },
  {
    path: 'patronistas',
    loadComponent: () => import('./patronistas/patronistas.component'),
  },
  {
    path: 'cortadores',
    loadComponent: () => import('./cortadores/cortadores.component'),
  },
  {
    path: 'mecanicos',
    loadComponent: () => import('./mecanicos/mecanicos.component'),
  },
  {
    path: 'satelites',
    loadComponent: () => import('./satelites/satelites.component'),
  },
  {
    path: 'satelite/:id',
    loadComponent: () =>
      import('./satelite-individual/satelite-individual.component'),
  },
  {
    path: 'talleres',
    loadComponent: () => import('./talleres/talleres.component'),
  },
  {
    path: 'talleres/:id',
    loadComponent: () =>
      import('./taller-individual/taller-individual.component'),
  },
  {
    path: 'worker/:id',
    loadComponent: () =>
      import('./worker-individual/worker-individual.component'),
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.component'),
  },
  {
    path: 'positions',
    loadComponent: () => import('./positions/positions.component'),
  },
  {
    path: 'profile/edit-worker/:id',
    loadComponent: () =>
      import('./edit-profile-worker/edit-profile-worker.component'),
  },
  {
    path: 'profile/edit-business/:id',
    loadComponent: () =>
      import('./edit-profile-business/edit-profile-business.component'),
  },
  {
    path: '**',
    loadComponent: () => import('./costureros/costureros.component'),
  },
] as Routes;
