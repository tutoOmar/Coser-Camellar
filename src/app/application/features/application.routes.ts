import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./news/news.component'),
  },
  {
    path: 'new',
    loadComponent: () => import('./news-form/news-form.component'),
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./news-form/news-form.component'),
  },
] as Routes;
