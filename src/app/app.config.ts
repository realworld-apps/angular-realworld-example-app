import { ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Jwt } from './core/auth/services/jwt';
import { UserAuth } from './core/auth/services/user-auth';
import { apiInterceptor } from './core/interceptors/api-interceptor';
import { tokenInterceptor } from './core/interceptors/token-interceptor';
import { errorInterceptor } from './core/interceptors/error-interceptor';
import { EMPTY } from 'rxjs';

export function initAuth(jwtService: Jwt, userService: UserAuth) {
  return () => (jwtService.getToken() ? userService.getCurrentUser() : EMPTY);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiInterceptor, tokenInterceptor, errorInterceptor])),
    provideAppInitializer(() => {
      const initializerFn = initAuth(inject(Jwt), inject(UserAuth));
      return initializerFn();
    }),
  ],
};
