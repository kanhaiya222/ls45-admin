import { Pipe, PipeTransform, inject } from '@angular/core';
import { BrandingService } from './branding.service';

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED ', SGD: 'S$', AUD: 'A$', JPY: '¥', CAD: 'C$',
};

/**
 * Formats a price using the tenant's configured currency (from BrandingService). Replaces the
 * previously hardcoded `₹{{ x | number }}` so prices reflect the currency chosen in Settings.
 * Branding is applied in an awaited APP_INITIALIZER, so the currency is known before first render —
 * a pure pipe is sufficient.
 */
@Pipe({ name: 'brandPrice', standalone: true })
export class BrandPricePipe implements PipeTransform {
  private readonly branding = inject(BrandingService);

  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '';
    }
    const code = this.branding.branding()?.currencyCode || 'INR';
    const symbol = CURRENCY_SYMBOLS[code] ?? `${code} `;
    return symbol + Math.round(value).toLocaleString('en-US');
  }
}
