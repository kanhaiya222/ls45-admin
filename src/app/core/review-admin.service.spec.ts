import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from './config';
import { ReviewAdminService } from './review-admin.service';

describe('ReviewAdminService', () => {
  let service: ReviewAdminService;
  let http: HttpTestingController;
  const base = `${API_BASE_URL}/admin/reviews`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReviewAdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists reviews filtered by status', () => {
    service.list('PENDING').subscribe();
    const req = http.expectOne((r) => r.url === base && r.params.get('status') === 'PENDING');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true } });
  });

  it('approves a review via POST', () => {
    service.approve('r1').subscribe();
    const req = http.expectOne(`${base}/r1/approve`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: { publicId: 'r1', status: 'APPROVED' } });
  });

  it('rejects a review via POST', () => {
    service.reject('r1').subscribe();
    const req = http.expectOne(`${base}/r1/reject`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: { publicId: 'r1', status: 'REJECTED' } });
  });
});
