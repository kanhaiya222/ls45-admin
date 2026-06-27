import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from './config';
import { RoleAdminService } from './role-admin.service';

describe('RoleAdminService', () => {
  let service: RoleAdminService;
  let http: HttpTestingController;
  const base = `${API_BASE_URL}/admin/roles`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RoleAdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists roles', () => {
    service.listRoles().subscribe();
    const req = http.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [] });
  });

  it('creates a role with its permission codes', () => {
    service
      .createRole({ name: 'Content Editor', permissionCodes: ['CONTENT:WRITE:ALL'] })
      .subscribe();

    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.permissionCodes).toEqual(['CONTENT:WRITE:ALL']);
    req.flush({ success: true, data: {} });
  });

  it('updates a role via PUT on its publicId', () => {
    service.updateRole('role-1', { name: 'Ops', permissionCodes: [] }).subscribe();

    const req = http.expectOne(`${base}/role-1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ success: true, data: {} });
  });

  it('reads the permission catalogue from /admin/permissions', () => {
    service.listPermissions().subscribe();
    const req = http.expectOne(`${API_BASE_URL}/admin/permissions`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [] });
  });
});
