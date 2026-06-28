import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from './config';
import { ProductAdminService } from './product-admin.service';

describe('ProductAdminService', () => {
  let service: ProductAdminService;
  let http: HttpTestingController;
  const base = `${API_BASE_URL}/admin/products`;

  const emptyPage = {
    success: true,
    data: { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductAdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists products with paging params and no status', () => {
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
    expect(req.request.method).toBe('GET');
    req.flush(emptyPage);
  });

  it('creates a product via POST', () => {
    service
      .create({ name: 'Tea', sku: 'T-1', basePrice: 100, weightGrams: 50, featured: false })
      .subscribe();

    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.sku).toBe('T-1');
    req.flush({ success: true, data: { publicId: 'p1', name: 'Tea', sku: 'T-1', featured: false } });
  });

  it('publishes a product via POST', () => {
    service.publish('p1').subscribe();

    const req = http.expectOne(`${base}/p1/publish`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: null });
  });

  it('adds a variant via POST to the variants sub-resource', () => {
    service
      .addVariant('p1', { sku: 'T-1-100', variantName: '100g', sortOrder: 0, active: true })
      .subscribe();

    const req = http.expectOne(`${base}/p1/variants`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.variantName).toBe('100g');
    req.flush({ success: true, data: { publicId: 'v1', sku: 'T-1-100', variantName: '100g', sortOrder: 0, active: true } });
  });

  it('deletes a product via DELETE', () => {
    service.delete('p1').subscribe();

    const req = http.expectOne(`${base}/p1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, data: null });
  });
});
