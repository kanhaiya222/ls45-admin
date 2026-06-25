import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../config';
import { AuthService } from './auth.service';

/**
 * Attaches the Bearer access token to admin API calls. The /auth/* endpoints are skipped:
 * they are public (login) or carry their own Authorization header (logout).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_BASE_URL) || req.url.includes('/auth/')) {
    return next(req);
  }
  const token = inject(AuthService).getAccessToken();
  if (!token) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
