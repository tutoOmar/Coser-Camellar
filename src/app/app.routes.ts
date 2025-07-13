import { Routes } from '@angular/router';
import { application } from 'express';
import { privateGuard, publicGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    //canActivateChild: [publicGuard()],
    path: 'auth',
    loadChildren: () => import('./auth/features/auth.routes'),
  },
  {
    //Desactivamos el guard para que puedan ir a noticias de momento
    // canActivateChild: [privateGuard()],
    path: 'aplication',
    loadComponent: () => import('./shared/ui/header/header.component'),
    loadChildren: () => import('./application/features/application.routes'),
  },
  {
    path: 'publication',
    loadComponent: () => import('./shared/ui/header/header.component'),
    loadChildren: () => import('./publication/publication.routes'),
  },
  {
    path: 'works',
    loadComponent: () => import('./shared/ui/header/header.component'),
    loadChildren: () => import('./works/features/works.routes'),
  },
  {
    path: 'comercial',
    loadChildren: () => import('./comercial/comercial.routes'),
  },
  {
    path: '**',
    redirectTo: '/publication',
    pathMatch: 'full',
  },
];
