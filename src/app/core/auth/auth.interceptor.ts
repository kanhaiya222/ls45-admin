import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config';
import { AuthService } from './auth.service';

/**
 * Attaches the Bearer access token to admin API calls and keeps the session alive:
 * on a 401 it transparently refreshes the access token and retries the request once.
 * If the refresh fails (token expired/revoked, or signed out elsewhere) the session is
 * cleared and the user is redirected to /login with a returnUrl so they land back where
 * they were after signing in. The /auth/* endpoints are skipped (public, or self-authed).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!req.url.startsWith(API_BASE_URL) || req.url.includes('/auth/')) {
    return next(req);
  }

  const token = auth.getAccessToken();
  const authed = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) {
        return throwError(() => err);
      }
      // Access token rejected — try a one-shot refresh, then replay the original request.
      return auth.refreshAccessToken().pipe(
        switchMap((fresh) =>
          next(req.clone({ setHeaders: { Authorization: `Bearer ${fresh}` } })),
        ),
        catchError((refreshErr) => {
          redirectToLogin(auth, router);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};

/** Ends the session and sends the user to the login page, preserving where they were. */
function redirectToLogin(auth: AuthService, router: Router): void {
  auth.sessionExpired();
  const url = router.url;
  const returnUrl = url && !url.startsWith('/login') ? url : '/';
  void router.navigate(['/login'], { queryParams: { returnUrl } });
}
