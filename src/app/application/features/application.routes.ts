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
    path: 'marketplace',
    loadComponent: () => import('./marketplace/marketplace.component'),
  },
  {
    path: 'marketplace/add',
    loadComponent: () =>
      import('./marketplace/add-product/add-product.component'),
  },
  {
    path: 'marketplace/my-products',
    loadComponent: () =>
      import('./marketplace/my-products/my-products.component'),
  },
  {
    path: 'marketplace/edit/:id',
    loadComponent: () =>
      import('./marketplace/edit-product/edit-product.component'),
  },
  {
    path: 'newNews/:id',
    loadComponent: () => import('./news-form/news-form.component'),
  },
] as Routes;
