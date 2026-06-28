import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from './config';
import { InventoryAdminService } from './inventory-admin.service';

describe('InventoryAdminService', () => {
  let service: InventoryAdminService;
  let http: HttpTestingController;
  const base = API_BASE_URL;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(InventoryAdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates a warehouse', () => {
    service.createWarehouse({ name: 'DC', code: 'DC1' }).subscribe();
    const req = http.expectOne(`${base}/admin/warehouses`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.code).toBe('DC1');
    req.flush({ success: true, data: {} });
  });

  it('activates / deactivates a warehouse', () => {
    service.setWarehouseActive('w1', false).subscribe();
    const req = http.expectOne(`${base}/admin/warehouses/w1/deactivate`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: {} });
  });

  it('adjusts stock', () => {
    service.adjust({ warehousePublicId: 'w1', variantPublicId: 'v1', quantityDelta: 100, movementType: 'INBOUND' }).subscribe();
    const req = http.expectOne(`${base}/admin/stock/adjust`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.quantityDelta).toBe(100);
    req.flush({ success: true, data: {} });
  });

  it('reads stock levels for a variant', () => {
    service.stockForVariant('v1').subscribe();
    const req = http.expectOne(`${base}/admin/stock/variants/v1`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [] });
  });
});
