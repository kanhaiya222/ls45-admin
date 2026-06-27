import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from './config';
import { UserAdminService } from './user-admin.service';

describe('UserAdminService', () => {
  let service: UserAdminService;
  let http: HttpTestingController;
  const base = `${API_BASE_URL}/admin/users`;

  const emptyPage = {
    success: true,
    data: { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserAdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('narrows the list to staff with the audience param', () => {
    service.list({ audience: 'STAFF' }).subscribe();

    const req = http.expectOne((r) => r.url === base);
    expect(req.request.params.get('audience')).toBe('STAFF');
    expect(req.request.params.get('page')).toBe('0');
    req.flush(emptyPage);
  });

  it('passes a trimmed search term and omits it when blank', () => {
    service.list({ search: '  ada  ' }).subscribe();
    const withSearch = http.expectOne((r) => r.url === base && r.params.get('search') === 'ada');
    withSearch.flush(emptyPage);

    service.list({ search: '   ' }).subscribe();
    const noSearch = http.expectOne((r) => r.url === base);
    expect(noSearch.request.params.get('search')).toBeNull();
    noSearch.flush(emptyPage);
  });

  it('creates a staff member via POST', () => {
    service
      .createStaff({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@ls45.test', password: 'secret123' })
      .subscribe();

    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.email).toBe('ada@ls45.test');
    req.flush({ success: true, data: {} });
  });

  it('assigns a role by name in the roleCode field', () => {
    service.assignRole('u-1', 'MANAGER').subscribe();

    const req = http.expectOne(`${base}/u-1/roles`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ roleCode: 'MANAGER' });
    req.flush({ success: true, data: null });
  });

  it('removes a role via DELETE on the encoded role name', () => {
    service.removeRole('u-1', 'TENANT_ADMIN').subscribe();

    const req = http.expectOne(`${base}/u-1/roles/TENANT_ADMIN`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, data: null });
  });

  it('suspends and activates via POST', () => {
    service.suspend('u-2').subscribe();
    http.expectOne(`${base}/u-2/suspend`).flush({ success: true, data: null });

    service.activate('u-2').subscribe();
    http.expectOne(`${base}/u-2/activate`).flush({ success: true, data: null });
  });
});
