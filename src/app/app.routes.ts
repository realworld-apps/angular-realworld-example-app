import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from './core/auth/services/user.service';
import { map } from 'rxjs/operators';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/article/pages/home/home.component'),
  },
  {
    path: 'tag/:tag',
    loadComponent: () => import('./features/article/pages/home/home.component'),
  },
  {
    path: 'login',
    loadComponent: () => import('./core/auth/auth.component'),
    canActivate: [() => inject(UserService).isAuthenticated.pipe(map(isAuth => !isAuth))],
  },
  {
    path: 'register',
    loadComponent: () => import('./core/auth/auth.component'),
    canActivate: [() => inject(UserService).isAuthenticated.pipe(map(isAuth => !isAuth))],
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component'),
    canActivate: [() => inject(UserService).isAuthenticated],
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
        loadComponent: () => import('./features/article/pages/editor/editor.component'),
        canActivate: [() => inject(UserService).isAuthenticated],
      },
      {
        path: ':slug',
        loadComponent: () => import('./features/article/pages/editor/editor.component'),
        canActivate: [() => inject(UserService).isAuthenticated],
      },
    ],
  },
  {
    path: 'article/:slug',
    loadComponent: () => import('./features/article/pages/article/article.component'),
  },
];
