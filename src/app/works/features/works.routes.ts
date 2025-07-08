import { Routes } from '@angular/router';
import { privateGuard } from '../../core/auth.guard';

export default [
  {
    path: 'main',
    loadComponent: () => import('./main/main.component'),
  },
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
    canActivate: [privateGuard],
  },
  {
    path: 'positions',
    loadComponent: () => import('./positions/positions.component'),
  },
  {
    path: 'positions/new',
    loadComponent: () =>
      import('./positions/add-position/add-position.component'),
  },
  {
    path: 'positions/edit/:id',
    loadComponent: () =>
      import('./positions/edit-position/edit-position.component'),
  },
  {
    path: 'profile/edit-worker/:id',
    loadComponent: () =>
      import('./profile/edit-profile-worker/edit-profile-worker.component'),
  },
  {
    path: 'profile/edit-business/:id',
    loadComponent: () =>
      import('./profile/edit-profile-business/edit-profile-business.component'),
  },
  {
    path: 'profile/edit-empresa/:id',
    loadComponent: () =>
      import(
        './profile/edit-profile-empresa-or-natural-person/edit-profile-empresa-or-natural-person.component'
      ),
  },
  {
    path: 'profile/edit-natural-person/:id',
    loadComponent: () =>
      import(
        './profile/edit-profile-empresa-or-natural-person/edit-profile-empresa-or-natural-person.component'
      ),
  },
  {
    path: 'politicas',
    loadComponent: () => import('./politicas/politicas.component'),
  },
  {
    path: '**',
    loadComponent: () => import('./main/main.component'),
  },
] as Routes;
