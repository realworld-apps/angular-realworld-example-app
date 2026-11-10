import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserService } from '../auth/services/user.service';

/**
 * Global HTTP error interceptor.
 *
 * ## 401 Handling Strategy
 *
 * There are two layers of 401 handling:
 *
 * 1. GET /user endpoint (auth initialization):
 *    - Handled by UserService.getCurrentUser() with 4XX vs 5XX logic
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
  const userService = inject(UserService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Global 401 handling for all endpoints EXCEPT /user
      // (token expired mid-session → logout)
      // /user is handled by UserService.getCurrentUser() with 4XX vs 5XX logic
      if (err.status === 401 && !req.url.endsWith('/user')) {
        userService.purgeAuth();
      }

      // Normalize error format: { errors: {...}, status: number }
      // Provides a status-based fallback message when the body has no errors
      const body =
        err.error && typeof err.error === 'object' && 'errors' in err.error
          ? err.error
          : { errors: fallbackErrors(err.status) };

      return throwError(() => ({ ...body, status: err.status }));
    }),
  );
};

/**
 * Builds a fallback error message based on the HTTP status,
 * used when the server response doesn't include an `errors` object.
 */
function fallbackErrors(status: number): Record<string, string[]> {
  switch (status) {
    case 0:
      return { Conexão: ['indisponível. Verifique sua conexão com a internet.'] };
    case 400:
      return { Requisição: ['inválida. Revise os dados e tente novamente.'] };
    case 401:
      return { Sessão: ['expirada. Faça login novamente.'] };
    case 403:
      return { Acesso: ['negado. Você não tem permissão para realizar esta ação.'] };
    case 404:
      return { Recurso: ['não encontrado.'] };
    case 408:
    case 504:
      return { Tempo: ['de resposta esgotado. Tente novamente.'] };
    case 409:
      return { Conflito: ['o recurso já existe ou foi alterado.'] };
    case 422:
      return { Dados: ['não puderam ser processados. Verifique os campos e tente novamente.'] };
    case 429:
      return { Muitas: ['requisições em pouco tempo. Aguarde um momento e tente novamente.'] };
    default:
      if (status >= 500) {
        return { Erro: ['no servidor. Tente novamente mais tarde.'] };
      }
      return { Erro: [`inesperado (status ${status}).`] };
  }
}
