import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ModuleAccessPage } from './module-access';
import { API_BASE_URL } from '../../core/config';
import { Role } from '../../core/models';

/** Matrix toggle writes the right role-permission calls and updates local state. */
describe('ModuleAccessPage', () => {
  let component: ModuleAccessPage;
  let http: HttpTestingController;
  const rolesUrl = `${API_BASE_URL}/admin/roles`;

  const roles: Role[] = [
    { publicId: 'r1', name: 'OPERATOR_STAFF', permissionCodes: ['booking:read:all'], system: true },
    { publicId: 'rsuper', name: 'SUPER_ADMIN', permissionCodes: [], system: true },
    { publicId: 'rcust', name: 'CUSTOMER', permissionCodes: [], system: true },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ModuleAccessPage],
    });
    component = TestBed.inject(ModuleAccessPage);
    http = TestBed.inject(HttpTestingController);
    http.expectOne(rolesUrl).flush({ success: true, data: roles });
  });

  afterEach(() => http.verify());

  it('excludes CUSTOMER and the full-access admins from editable rows', () => {
    expect(component.rows().map((r) => r.name)).toEqual(['OPERATOR_STAFF']);
    expect(component.lockedRows().map((r) => r.name)).toEqual(['SUPER_ADMIN']);
  });

  it('reflects which modules a role already has', () => {
    const role = component.rows()[0];
    const bookings = component.modules.find((m) => m.id === 'bookings')!;
    const content = component.modules.find((m) => m.id === 'content')!;
    expect(component.hasModule(role, bookings)).toBeTrue();
    expect(component.hasModule(role, content)).toBeFalse();
  });

  it('granting a module POSTs its codes and updates state', () => {
    const content = component.modules.find((m) => m.id === 'content')!;
    component.toggle(component.rows()[0], content);

    const req = http.expectOne(`${rolesUrl}/r1/permissions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(['content:read:all', 'content:manage:all']);
    req.flush({ success: true, data: null });

    expect(component.hasModule(component.rows()[0], content)).toBeTrue();
  });

  it('revoking a module DELETEs its code and updates state', () => {
    const bookings = component.modules.find((m) => m.id === 'bookings')!;
    component.toggle(component.rows()[0], bookings);

    const del = http.expectOne(`${rolesUrl}/r1/permissions/booking%3Aread%3Aall`);
    expect(del.request.method).toBe('DELETE');
    del.flush({ success: true, data: null });

    expect(component.hasModule(component.rows()[0], bookings)).toBeFalse();
  });
});
