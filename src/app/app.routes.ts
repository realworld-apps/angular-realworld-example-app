import { Router, Routes } from '@angular/router';
import { inject } from '@angular/core';
import { UserAuth } from './core/auth/services/user-auth';
import { map } from 'rxjs/operators';

/**
 * Guard that requires authentication. Redirects to /login if not authenticated.
 */
const requireAuth = () => {
  const router = inject(Router);
  return inject(UserAuth).isAuthenticated.pipe(map(isAuth => isAuth || router.createUrlTree(['/login'])));
};

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
    canActivate: [() => inject(UserAuth).isAuthenticated.pipe(map(isAuth => !isAuth))],
  },
  {
    path: 'register',
    loadComponent: () => import('./core/auth/auth'),
    canActivate: [() => inject(UserAuth).isAuthenticated.pipe(map(isAuth => !isAuth))],
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings'),
    canActivate: [requireAuth],
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
        canActivate: [requireAuth],
      },
      {
        path: ':slug',
        loadComponent: () => import('./features/article/pages/editor/editor'),
        canActivate: [requireAuth],
      },
    ],
  },
  {
    path: 'article/:slug',
    loadComponent: () => import('./features/article/pages/article/article'),
  },
];
