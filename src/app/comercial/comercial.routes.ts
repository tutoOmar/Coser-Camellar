import { Routes } from '@angular/router';

export default [
  {
    path: 'us',
    loadComponent: () => import('./landing-page/landing-page.component'),
  },
  {
    path: 'blog',
    loadComponent: () => import('./blog/blog.component'),
  },
  {
    path: '',
    loadComponent: () => import('./landing-page/landing-page.component'),
  },
] as Routes;
