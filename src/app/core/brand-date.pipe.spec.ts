import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BrandDatePipe } from './brand-date.pipe';
import { BrandingService } from './branding.service';
import { Branding } from './models';

const BASE: Branding = {
  siteName: 'LS45',
  primaryColor: '#0F6E56',
  accentColor: '#D85A30',
  headingFont: 'serif',
  bodyFont: 'sans',
  timezone: 'Asia/Kolkata',
  currencyCode: 'INR',
  dateFormat: 'd MMM y',
};

describe('BrandDatePipe (admin)', () => {
  let pipe: BrandDatePipe;
  let branding: BrandingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), BrandDatePipe],
    });
    pipe = TestBed.inject(BrandDatePipe);
    branding = TestBed.inject(BrandingService);
  });

  it('returns empty string for null/undefined/empty', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('uses the default format when no branding is loaded', () => {
    expect(pipe.transform('2026-11-10')).toBe('10 Nov 2026');
  });

  it('applies the tenant-configured date format', () => {
    branding.apply({ ...BASE, dateFormat: 'dd/MM/yyyy' });
    expect(pipe.transform('2026-11-10')).toBe('10/11/2026');
  });

  it('honours an explicit format argument over the configured default', () => {
    branding.apply({ ...BASE, dateFormat: 'dd/MM/yyyy' });
    expect(pipe.transform('2026-11-10', 'yyyy')).toBe('2026');
  });

  it('renders a UTC instant in the configured IANA timezone (DST-aware offset)', () => {
    branding.apply({ ...BASE, timezone: 'Asia/Kolkata' });
    expect(pipe.transform('2026-11-10T20:00:00Z', 'd MMM y HH:mm')).toBe('11 Nov 2026 01:30');
    branding.apply({ ...BASE, timezone: 'America/New_York' });
    expect(pipe.transform('2026-11-10T20:00:00Z', 'd MMM y HH:mm')).toBe('10 Nov 2026 15:00');
  });
});
