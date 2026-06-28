import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from './config';
import { OrderAdminService } from './order-admin.service';

describe('OrderAdminService', () => {
  let service: OrderAdminService;
  let http: HttpTestingController;
  const base = `${API_BASE_URL}/admin`;

  const emptyPage = {
    success: true,
    data: { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrderAdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists orders with a status filter', () => {
    service.list('CONFIRMED').subscribe();
    const req = http.expectOne((r) => r.url === `${base}/orders` && r.params.get('status') === 'CONFIRMED');
    expect(req.request.method).toBe('GET');
    req.flush(emptyPage);
  });

  it('creates a shipment via the fulfillment endpoint', () => {
    service.createShipment('o1', { carrier: 'Bluedart', trackingNumber: 'BD123' }).subscribe();
    const req = http.expectOne(`${base}/fulfillment/orders/o1/shipments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.carrier).toBe('Bluedart');
    req.flush({ success: true, data: { publicId: 's1', orderPublicId: 'o1', status: 'PENDING' } });
  });

  it('lists shipments for an order (admin, tenant-scoped)', () => {
    service.listOrderShipments('o1').subscribe();
    const req = http.expectOne(`${base}/fulfillment/orders/o1/shipments`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [] });
  });

  it('updates shipment status via PATCH', () => {
    service.updateShipmentStatus('s1', { status: 'DISPATCHED' }).subscribe();
    const req = http.expectOne(`${base}/fulfillment/shipments/s1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.status).toBe('DISPATCHED');
    req.flush({ success: true, data: { publicId: 's1', orderPublicId: 'o1', status: 'DISPATCHED' } });
  });

  it('posts a return refund action', () => {
    service.returnAction('r1', 'refund').subscribe();
    const req = http.expectOne(`${base}/returns/r1/refund`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: { publicId: 'r1', orderPublicId: 'o1', status: 'REFUNDED' } });
  });
});
