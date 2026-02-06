import { ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Jwt } from './core/auth/services/jwt';
import { User, AuthState } from './core/auth/services/user';
import { apiInterceptor } from './core/interceptors/api-interceptor';
import { tokenInterceptor } from './core/interceptors/token-interceptor';
import { errorInterceptor } from './core/interceptors/error-interceptor';
import { EMPTY } from 'rxjs';
import { User } from './core/auth/user.model';

/**
 * Debug interface for testing - exposes app state in a framework-agnostic way.
 * Tests can use this instead of directly accessing localStorage or internal state.
 */
export interface ConduitDebug {
  getToken: () => string | null;
  getAuthState: () => AuthState;
  getCurrentUser: () => User | null;
}

declare global {
  interface Window {
    __conduit_debug__?: ConduitDebug;
  }
}

/**
 * Sets up the debug interface on window.__conduit_debug__
 */
function setupDebugInterface(jwtService: Jwt, userService: User): void {
  let currentAuthState: AuthState = 'loading';
  let currentUser: User | null = null;

  userService.authState.subscribe(state => (currentAuthState = state));
  userService.currentUser.subscribe(user => (currentUser = user));

  window.__conduit_debug__ = {
    getToken: () => jwtService.getToken(),
    getAuthState: () => currentAuthState,
    getCurrentUser: () => currentUser,
  };
}

/**
 * App initializer: checks auth state at startup.
 *
 * - No token → purgeAuth() to exit 'loading' state → 'unauthenticated'
 * - Token exists → getCurrentUser() to validate it:
 *     - Success → 'authenticated'
 *     - 4XX → 'unauthenticated' (invalid token, cleared)
 *     - 5XX → 'unavailable' (server down, token kept, auto-retry)
 */
export function initAuth(jwtService: Jwt, userService: User) {
  return () => {
    setupDebugInterface(jwtService, userService);

    if (jwtService.getToken()) {
      return userService.getCurrentUser();
    } else {
      userService.purgeAuth();
      return EMPTY;
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiInterceptor, tokenInterceptor, errorInterceptor])),
    provideAppInitializer(() => {
      const initializerFn = initAuth(inject(Jwt), inject(User));
      return initializerFn();
    }),
  ],
};
