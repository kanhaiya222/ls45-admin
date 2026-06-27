import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TeamRolesPage } from './team-roles';
import { API_BASE_URL } from '../../core/config';
import { Permission, Role } from '../../core/models';

/** Matrix logic tests for the Roles screen — grouping, toggling, and the save payload. */
describe('TeamRolesPage', () => {
  let component: TeamRolesPage;
  let http: HttpTestingController;

  const permissions: Permission[] = [
    { code: 'BOOKING:READ:ALL', resource: 'BOOKING', action: 'READ', scope: 'ALL' },
    { code: 'BOOKING:WRITE:ALL', resource: 'BOOKING', action: 'WRITE', scope: 'ALL' },
    { code: 'CONTENT:WRITE:ALL', resource: 'CONTENT', action: 'WRITE', scope: 'ALL' },
  ];

  function flushInitial(roles: Role[] = []): void {
    http.expectOne(`${API_BASE_URL}/admin/roles`).flush({ success: true, data: roles });
    http.expectOne(`${API_BASE_URL}/admin/permissions`).flush({ success: true, data: permissions });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TeamRolesPage],
    });
    component = TestBed.inject(TeamRolesPage);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('groups permissions by resource, sorted', () => {
    flushInitial();
    const groups = component.groups();
    expect(groups.map((g) => g.resource)).toEqual(['BOOKING', 'CONTENT']);
    expect(groups[0].permissions.length).toBe(2);
  });

  it('toggles a single permission on and off', () => {
    flushInitial();
    expect(component.isChecked('BOOKING:READ:ALL')).toBeFalse();
    component.toggle('BOOKING:READ:ALL');
    expect(component.isChecked('BOOKING:READ:ALL')).toBeTrue();
    expect(component.selectedCount()).toBe(1);
    component.toggle('BOOKING:READ:ALL');
    expect(component.isChecked('BOOKING:READ:ALL')).toBeFalse();
  });

  it('select-all on a group toggles every permission in it', () => {
    flushInitial();
    const bookingGroup = component.groups()[0];
    expect(component.allInGroup(bookingGroup)).toBeFalse();
    component.toggleGroup(bookingGroup);
    expect(component.allInGroup(bookingGroup)).toBeTrue();
    expect(component.selectedCount()).toBe(2);
  });

  it('pre-checks the role\'s codes when editing', () => {
    flushInitial();
    component.startEdit({
      publicId: 'r-1',
      name: 'Editor',
      permissionCodes: ['CONTENT:WRITE:ALL'],
      system: false,
    });
    expect(component.isChecked('CONTENT:WRITE:ALL')).toBeTrue();
    expect(component.isEditing()).toBeTrue();
  });

  it('refuses to edit a system role', () => {
    flushInitial();
    component.startEdit({ publicId: 'r-sys', name: 'SUPER_ADMIN', permissionCodes: [], system: true });
    expect(component.isEditing()).toBeFalse();
  });

  it('POSTs the selected codes when creating a role', () => {
    flushInitial();
    component.startCreate();
    component.form.setValue({ name: 'Content Editor', description: '' });
    component.toggle('CONTENT:WRITE:ALL');

    component.save();

    const req = http.expectOne(`${API_BASE_URL}/admin/roles`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.permissionCodes).toEqual(['CONTENT:WRITE:ALL']);
    req.flush({ success: true, data: {} });
    // reload roles after save
    http.expectOne(`${API_BASE_URL}/admin/roles`).flush({ success: true, data: [] });
  });
});
