import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BrandPricePipe } from './brand-price.pipe';
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

describe('BrandPricePipe (admin)', () => {
  let pipe: BrandPricePipe;
  let branding: BrandingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), BrandPricePipe],
    });
    pipe = TestBed.inject(BrandPricePipe);
    branding = TestBed.inject(BrandingService);
  });

  it('formats with ₹ for INR by default (no branding loaded)', () => {
    expect(pipe.transform(45000)).toBe('₹45,000');
  });

  it('uses the configured currency symbol', () => {
    branding.apply({ ...BASE, currencyCode: 'USD' });
    expect(pipe.transform(1234)).toBe('$1,234');
    branding.apply({ ...BASE, currencyCode: 'EUR' });
    expect(pipe.transform(1234)).toBe('€1,234');
  });

  it('falls back to the code as a prefix for unknown currencies', () => {
    branding.apply({ ...BASE, currencyCode: 'ZAR' });
    expect(pipe.transform(1000)).toBe('ZAR 1,000');
  });

  it('rounds and returns empty for null/undefined', () => {
    expect(pipe.transform(99.7)).toBe('₹100');
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
