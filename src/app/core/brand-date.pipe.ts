import { formatDate } from '@angular/common';
import { Pipe, PipeTransform, inject } from '@angular/core';
import { BrandingService } from './branding.service';

/**
 * Formats a date using the tenant's configured timezone + date format (from BrandingService).
 * Replaces bare `| date` so the Localization settings actually take effect. A `format` argument
 * overrides the configured default for a specific display. Angular's formatDate only accepts a
 * numeric offset (not IANA names), so the IANA timezone is converted to the correct offset for the
 * given instant (DST-aware) via Intl.
 */
@Pipe({ name: 'brandDate', standalone: true })
export class BrandDatePipe implements PipeTransform {
  private readonly branding = inject(BrandingService);

  transform(value: string | number | Date | null | undefined, format?: string): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const b = this.branding.branding();
    const fmt = format || b?.dateFormat || 'd MMM y';
    const offset = b?.timezone ? offsetFor(value, b.timezone) : undefined;
    try {
      return formatDate(value, fmt, 'en-US', offset);
    } catch {
      return formatDate(value, fmt, 'en-US');
    }
  }
}

/** Current UTC offset (e.g. "+0530") for an instant in an IANA timezone; undefined if unresolvable. */
function offsetFor(value: string | number | Date, tz: string): string | undefined {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'longOffset',
    }).formatToParts(new Date(value));
    const name = parts.find((p) => p.type === 'timeZoneName')?.value; // e.g. "GMT+05:30" / "GMT"
    const m = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name ?? '');
    if (m) {
      return `${m[1]}${m[2]}${m[3] ?? '00'}`;
    }
    if (name === 'GMT') {
      return '+0000';
    }
  } catch {
    /* unsupported tz / runtime — fall back to local */
  }
  return undefined;
}
