import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { API_BASE_URL } from '../config';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor (session refresh + expiry redirect)', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let auth: AuthService;
  let router: { navigate: jasmine.Spy; url: string };
  const apiUrl = `${API_BASE_URL}/admin/dashboard`;
  const refreshUrl = `${API_BASE_URL}/auth/refresh`;
  const user = { id: 1, email: 'admin@ls45.io', roles: ['TENANT_ADMIN'] };

  beforeEach(() => {
    localStorage.setItem('ls45admin.accessToken', 'old-access');
    localStorage.setItem('ls45admin.refreshToken', 'refresh-1');
    localStorage.setItem('ls45admin.user', JSON.stringify(user));
    router = { navigate: jasmine.createSpy('navigate'), url: '/departures' };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    ctrl.verify();
    localStorage.clear();
  });

  it('attaches the bearer access token to API calls', () => {
    http.get(apiUrl).subscribe();
    const req = ctrl.expectOne(apiUrl);
    expect(req.request.headers.get('Authorization')).toBe('Bearer old-access');
    req.flush({ success: true, data: {} });
  });

  it('on 401, refreshes the token and replays the original request (no redirect)', () => {
    let succeeded = false;
    http.get(apiUrl).subscribe(() => (succeeded = true));

    ctrl.expectOne(apiUrl).flush({}, { status: 401, statusText: 'Unauthorized' });

    const refresh = ctrl.expectOne(refreshUrl);
    expect(refresh.request.body.refreshToken).toBe('refresh-1');
    refresh.flush({
      success: true,
      data: { accessToken: 'new-access', refreshToken: 'refresh-2', user },
    });

    const retry = ctrl.expectOne(apiUrl);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
    retry.flush({ success: true, data: {} });

    expect(succeeded).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(localStorage.getItem('ls45admin.accessToken')).toBe('new-access');
  });

  it('redirects to /login (with returnUrl) and clears the session when refresh fails', () => {
    http.get(apiUrl).subscribe({ next: () => undefined, error: () => undefined });

    ctrl.expectOne(apiUrl).flush({}, { status: 401, statusText: 'Unauthorized' });
    ctrl.expectOne(refreshUrl).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/departures' },
    });
    expect(auth.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('ls45admin.accessToken')).toBeNull();
  });
});
