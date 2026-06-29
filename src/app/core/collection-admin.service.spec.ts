import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from './config';
import { CollectionAdminService } from './collection-admin.service';

describe('CollectionAdminService', () => {
  let service: CollectionAdminService;
  let http: HttpTestingController;
  const base = `${API_BASE_URL}/admin/product-collections`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CollectionAdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists collections (unwraps page content)', () => {
    let n = -1;
    service.list().subscribe((c) => (n = c.length));
    const req = http.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { content: [{ publicId: 'c1', name: 'Teas', slug: 'teas', status: 'DRAFT', sortOrder: 0 }] } });
    expect(n).toBe(1);
  });

  it('creates a collection', () => {
    service.create({ name: 'Teas', sortOrder: 0 }).subscribe();
    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('Teas');
    req.flush({ success: true, data: { publicId: 'c1' } });
  });

  it('adds a product to a collection', () => {
    service.addProduct('c1', 'p1', 2).subscribe();
    const req = http.expectOne(`${base}/c1/products`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ productPublicId: 'p1', sortOrder: 2 });
    req.flush({ success: true, data: null });
  });

  it('publishes a collection', () => {
    service.publish('c1').subscribe();
    const req = http.expectOne(`${base}/c1/publish`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: null });
  });
});
