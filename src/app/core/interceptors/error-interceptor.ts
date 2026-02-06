import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User } from '../auth/services/user';

/**
 * Global HTTP error interceptor.
 *
 * ## 401 Handling Strategy
 *
 * There are two layers of 401 handling:
 *
 * 1. GET /user endpoint (auth initialization):
 *    - Handled by User.getCurrentUser() with 4XX vs 5XX logic
 *    - This interceptor SKIPS /user to avoid double-handling
 *
 * 2. All OTHER endpoints (articles, comments, profiles, etc.):
 *    - Handled HERE - any 401 means "token expired mid-session"
 *    - We call purgeAuth() to logout immediately
 *
 * Both paths result in logout on 401, but /user needs special handling
 * because it also distinguishes 5XX errors (server down → retry).
 *
 * ## Error Format
 *
 * Re-throws errors with { ...body, status } format so that:
 * - Components can access err.errors for display (e.g., validation errors)
 * - Auth logic can check err.status for error type decisions
 * - Network errors get a user-friendly fallback message
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const userService = inject(User);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Global 401 handling for all endpoints EXCEPT /user
      // (token expired mid-session → logout)
      // /user is handled by User.getCurrentUser() with 4XX vs 5XX logic
      if (err.status === 401 && !req.url.endsWith('/user')) {
        userService.purgeAuth();
      }

      // Normalize error format: { errors: {...}, status: number }
      // Provides fallback message for network errors (status 0) or missing body
      const body =
        err.error && typeof err.error === 'object' && 'errors' in err.error
          ? err.error
          : { errors: { network: ['Unable to connect. Please check your internet connection.'] } };

      return throwError(() => ({ ...body, status: err.status }));
    }),
  );
};
