import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from './config';
import { CouponAdminService } from './coupon-admin.service';

describe('CouponAdminService', () => {
  let service: CouponAdminService;
  let http: HttpTestingController;
  const base = `${API_BASE_URL}/admin/coupon-campaigns`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CouponAdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists campaigns', () => {
    service.listCampaigns().subscribe();
    const req = http.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [] });
  });

  it('creates a coupon under a campaign', () => {
    service.createCoupon('camp1', { code: 'SAVE10', discountType: 'PERCENT', discountValue: 10 }).subscribe();
    const req = http.expectOne(`${base}/camp1/coupons`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.code).toBe('SAVE10');
    req.flush({ success: true, data: { publicId: 'c1', code: 'SAVE10', status: 'ACTIVE' } });
  });

  it('toggles coupon status via PATCH', () => {
    service.setCouponStatus('camp1', 'c1', 'INACTIVE').subscribe();
    const req = http.expectOne(`${base}/camp1/coupons/c1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'INACTIVE' });
    req.flush({ success: true, data: { publicId: 'c1', status: 'INACTIVE' } });
  });
});
