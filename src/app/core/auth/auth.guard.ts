import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Allows only authenticated admin users; everyone else is bounced to /login. */
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated() && auth.isAdmin()) {
    return true;
  }
  const router = inject(Router);
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Restricts a route to SUPER_ADMIN (e.g. Module Access); other admins are sent to the dashboard. */
export const superAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated() && auth.isSuperAdmin()) {
    return true;
  }
  return inject(Router).createUrlTree(['/']);
};
