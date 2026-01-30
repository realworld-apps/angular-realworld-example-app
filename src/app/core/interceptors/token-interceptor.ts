import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Jwt } from '../auth/services/jwt';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(Jwt).getToken();

  const request = req.clone({
    setHeaders: {
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  });
  return next(request);
};
