import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { API_BASE_URL } from './config';
import { ApiResponse, Branding } from './models';
import { brandCssVars } from './theme-ramp';

/**
 * Applies the tenant's site branding (colours, fonts, logo) to the running app. Fetches it from the
 * public /app/config at startup (APP_INITIALIZER) and can re-apply live after the Settings screen
 * saves. Colours are expanded into the full `--teal-*` / `--coral-*` token ramps so every button,
 * link and heading recolours.
 */
@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly http = inject(HttpClient);
  private readonly doc = inject(DOCUMENT);

  readonly branding = signal<Branding | null>(null);

  /** Fetch branding from /app/config and apply it. Never throws — falls back to the shipped theme. */
  async loadAndApply(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http
          .get<ApiResponse<{ branding: Branding }>>(`${API_BASE_URL}/app/config`)
          .pipe(timeout(3000)),
      );
      if (res?.data?.branding) {
        this.apply(res.data.branding);
      }
    } catch {
      /* offline / API down — keep the default compiled theme */
    }
  }

  /** Apply a branding object to the document (CSS variables, fonts, title, favicon). */
  apply(b: Branding): void {
    this.branding.set(b);
    const root = this.doc.documentElement;
    const vars = brandCssVars(b.primaryColor, b.accentColor);
    for (const [token, value] of Object.entries(vars)) {
      root.style.setProperty(token, value);
    }
    if (b.headingFont) {
      root.style.setProperty('--font-serif', b.headingFont);
    }
    if (b.bodyFont) {
      root.style.setProperty('--font-sans', b.bodyFont);
    }
    if (b.faviconUrl) {
      this.setFavicon(b.faviconUrl);
    }
  }

  private setFavicon(href: string): void {
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.rel = 'icon';
      this.doc.head.appendChild(link);
    }
    link.href = href;
  }
}
