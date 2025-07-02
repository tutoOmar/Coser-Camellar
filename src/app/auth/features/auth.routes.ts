import { Routes } from '@angular/router';

export default [
  {
    path: 'sign-in',
    loadComponent: () => import('./sign-in/sign-in.component'),
  },
  {
    path: 'sign-up',
    loadComponent: () => import('./sign-up/sign-up.component'),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component'),
  },
  {
    path: 'register-ux',
    loadComponent: () =>
      import('./register-experience/register-experience.component'),
  },
] as Routes;
