import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { User } from './core/auth/services/user';
import { map } from 'rxjs/operators';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/article/pages/home/home'),
  },
  {
    path: 'tag/:tag',
    loadComponent: () => import('./features/article/pages/home/home'),
  },
  {
    path: 'login',
    loadComponent: () => import('./core/auth/auth'),
    canActivate: [() => inject(User).isAuthenticated.pipe(map(isAuth => !isAuth))],
  },
  {
    path: 'register',
    loadComponent: () => import('./core/auth/auth'),
    canActivate: [() => inject(User).isAuthenticated.pipe(map(isAuth => !isAuth))],
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings'),
    canActivate: [() => inject(User).isAuthenticated],
  },
  {
    path: 'profile',
    loadChildren: () => import('./features/profile/profile.routes'),
  },
  {
    path: 'editor',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/article/pages/editor/editor'),
        canActivate: [() => inject(User).isAuthenticated],
      },
      {
        path: ':slug',
        loadComponent: () => import('./features/article/pages/editor/editor'),
        canActivate: [() => inject(User).isAuthenticated],
      },
    ],
  },
  {
    path: 'article/:slug',
    loadComponent: () => import('./features/article/pages/article/article'),
  },
];
