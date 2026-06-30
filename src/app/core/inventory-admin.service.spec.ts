import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from './config';
import { InventoryAdminService } from './inventory-admin.service';
import { VariantStock } from './models';

describe('InventoryAdminService', () => {
  let service: InventoryAdminService;
  let http: HttpTestingController;
  const base = `${API_BASE_URL}/admin/inventory/variants`;
  const sample: VariantStock = {
    variantPublicId: 'v1', sku: 'SKU1', variantName: '250g',
    stockQuantity: 7, stockStatus: 'IN_STOCK',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(InventoryAdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('PUTs an absolute quantity', () => {
    let got: VariantStock | undefined;
    service.setQuantity('v1', 7).subscribe((s) => (got = s));
    const req = http.expectOne(`${base}/v1/quantity`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.quantity).toBe(7);
    req.flush({ success: true, data: sample });
    expect(got?.stockStatus).toBe('IN_STOCK');
  });

  it('POSTs a relative adjustment', () => {
    service.adjustQuantity('v1', -2).subscribe();
    const req = http.expectOne(`${base}/v1/adjust`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.delta).toBe(-2);
    req.flush({ success: true, data: sample });
  });
});
