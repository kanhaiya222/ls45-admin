import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from './config';
import { PackageAdminService } from './package-admin.service';

describe('PackageAdminService', () => {
  let service: PackageAdminService;
  let http: HttpTestingController;
  const base = `${API_BASE_URL}/admin/packages`;

  const emptyPage = {
    success: true,
    data: { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PackageAdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists packages with paging params and no status', () => {
    let total = -1;
    service.list(null).subscribe((page) => (total = page.totalElements));

    const req = http.expectOne((r) => r.url === base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.get('status')).toBeNull();
    req.flush(emptyPage);

    expect(total).toBe(0);
  });

  it('adds a status param when filtering', () => {
    service.list('PUBLISHED').subscribe();

    const req = http.expectOne((r) => r.url === base && r.params.get('status') === 'PUBLISHED');
    req.flush(emptyPage);
  });

  it('publishes a package via POST', () => {
    service.publish('pkg-1').subscribe();

    const req = http.expectOne(`${base}/pkg-1/publish`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: null });
  });
});
