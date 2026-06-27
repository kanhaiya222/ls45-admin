import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { AuthUser } from '../models';

/** Permission-aware visibility: canAccess() drives which sidebar modules a user sees. */
describe('AuthService.canAccess', () => {
  function authFor(user: Partial<AuthUser>): AuthService {
    localStorage.setItem('ls45admin.user', JSON.stringify(user));
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return TestBed.inject(AuthService);
  }

  afterEach(() => localStorage.clear());

  it('always shows items with no permission requirement', () => {
    const auth = authFor({ roles: ['OPERATOR_STAFF'], permissions: [] });
    expect(auth.canAccess(null)).toBeTrue();
    expect(auth.canAccess(undefined)).toBeTrue();
  });

  it('top-level admins bypass and see every module', () => {
    const auth = authFor({ roles: ['TENANT_ADMIN'], permissions: [] });
    expect(auth.canAccess('content:read:all')).toBeTrue();
    expect(auth.canAccess('report:read:all')).toBeTrue();
  });

  it('a non-admin role sees only modules it holds the permission for', () => {
    const auth = authFor({ roles: ['CONTENT_MANAGER'], permissions: ['content:read:all', 'package:read:all'] });
    expect(auth.canAccess('content:read:all')).toBeTrue();
    expect(auth.canAccess('package:read:all')).toBeTrue();
    expect(auth.canAccess('booking:read:all')).toBeFalse();
    expect(auth.hasPermission('content:read:all')).toBeTrue();
    expect(auth.hasPermission('booking:read:all')).toBeFalse();
  });

  it('isSuperAdmin is false for a tenant admin', () => {
    expect(authFor({ roles: ['TENANT_ADMIN'] }).isSuperAdmin()).toBeFalse();
  });

  it('isSuperAdmin is true for a super admin', () => {
    expect(authFor({ roles: ['SUPER_ADMIN'] }).isSuperAdmin()).toBeTrue();
  });
});
