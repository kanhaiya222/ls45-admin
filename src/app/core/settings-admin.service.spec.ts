import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from './config';
import { SettingsAdminService } from './settings-admin.service';
import { Branding } from './models';

describe('SettingsAdminService', () => {
  let service: SettingsAdminService;
  let http: HttpTestingController;
  const url = `${API_BASE_URL}/admin/settings`;

  const sample: Branding = {
    siteName: 'LS45', primaryColor: '#0F6E56', accentColor: '#D85A30',
    headingFont: 'serif', bodyFont: 'sans', timezone: 'Asia/Kolkata',
    currencyCode: 'INR', dateFormat: 'd MMM y',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SettingsAdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GETs current settings', () => {
    let got: Branding | undefined;
    service.get().subscribe((b) => (got = b));
    const req = http.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: sample });
    expect(got?.siteName).toBe('LS45');
  });

  it('PUTs the updated branding', () => {
    service.update({ ...sample, siteName: 'New Brand', primaryColor: '#7C3AED' }).subscribe();
    const req = http.expectOne(url);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.siteName).toBe('New Brand');
    expect(req.request.body.primaryColor).toBe('#7C3AED');
    req.flush({ success: true, data: sample });
  });
});
