import { Routes } from '@angular/router';
import { Profile } from './pages/profile/profile';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: ':username',
        component: Profile,
        children: [
          {
            path: '',
            loadComponent: () => import('./components/profile-articles'),
          },
          {
            path: 'favorites',
            loadComponent: () => import('./components/profile-favorites'),
          },
        ],
      },
    ],
  },
];

export default routes;
