import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from './config';
import { ShippingAdminService } from './shipping-admin.service';

describe('ShippingAdminService', () => {
  let service: ShippingAdminService;
  let http: HttpTestingController;
  const base = `${API_BASE_URL}/admin/shipping`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ShippingAdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates a zone', () => {
    service.createZone({ name: 'India', code: 'IN', countryCodes: ['IN'], active: true }).subscribe();
    const req = http.expectOne(`${base}/zones`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.countryCodes).toEqual(['IN']);
    req.flush({ success: true, data: {} });
  });

  it('lists rates for a zone', () => {
    service.listRates('z1').subscribe();
    const req = http.expectOne(`${base}/zones/z1/rates`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [] });
  });

  it('creates a rate', () => {
    service.createRate({ zonePublicId: 'z1', methodPublicId: 'm1', price: 99, active: true }).subscribe();
    const req = http.expectOne(`${base}/rates`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.price).toBe(99);
    req.flush({ success: true, data: {} });
  });

  it('deletes a method', () => {
    service.deleteMethod('m1').subscribe();
    const req = http.expectOne(`${base}/methods/m1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, data: null });
  });
});
