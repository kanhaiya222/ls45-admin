import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Branding } from '../../core/models';
import { SettingsAdminService } from '../../core/settings-admin.service';
import { BrandingService } from '../../core/branding.service';
import { ToastService } from '../../core/toast.service';
import { ListStateComponent } from '../../shared/list-state/list-state';

type Tab = 'branding' | 'localization' | 'contact';
const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Site Settings — one place to control the customer site's look (logo, brand colours, fonts) and
 * shared config (timezone, currency, contact). Edits live-preview by re-theming the admin itself;
 * Save persists to the backend and re-applies. Leaving without saving reverts the preview.
 */
@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, ListStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsPage implements OnDestroy {
  private readonly api = inject(SettingsAdminService);
  private readonly brandingSvc = inject(BrandingService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly tab = signal<Tab>('branding');
  readonly loading = signal(true);
  readonly errored = signal(false);
  readonly saving = signal(false);
  readonly logoPreview = signal<string | null>(null);

  private saved: Branding | null = null;

  readonly timezones = [
    'Asia/Kolkata', 'UTC', 'America/New_York', 'America/Los_Angeles', 'America/Chicago',
    'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Singapore', 'Australia/Sydney',
  ];
  readonly currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD'];
  readonly dateFormats = ['d MMM y', 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'MMMM d, y'];
  readonly fonts: ReadonlyArray<{ value: string; label: string }> = [
    { value: "'DM Serif Display', Georgia, serif", label: 'DM Serif Display' },
    { value: "'DM Sans', system-ui, sans-serif", label: 'DM Sans' },
    { value: 'Georgia, "Times New Roman", serif', label: 'Georgia' },
    { value: 'system-ui, -apple-system, sans-serif', label: 'System UI' },
    { value: '"Playfair Display", Georgia, serif', label: 'Playfair Display' },
    { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
    { value: 'Poppins, system-ui, sans-serif', label: 'Poppins' },
    { value: 'Montserrat, system-ui, sans-serif', label: 'Montserrat' },
  ];

  /**
   * Options for a font <select>. Guarantees the currently-stored stack is always present, so a saved
   * value that doesn't exactly match a preset (e.g. "Georgia, serif") still shows instead of blanking.
   */
  fontOptions(current: string | null | undefined): { value: string; label: string }[] {
    if (current && !this.fonts.some((f) => f.value === current)) {
      return [{ value: current, label: this.fontLabel(current) }, ...this.fonts];
    }
    return [...this.fonts];
  }

  private fontLabel(stack: string): string {
    const first = (stack.split(',')[0] || '').trim().replace(/['"]/g, '');
    return first === 'system-ui' ? 'System UI' : first || stack;
  }

  readonly form = this.fb.nonNullable.group({
    siteName: ['', [Validators.required, Validators.maxLength(120)]],
    tagline: [''],
    primaryColor: ['#0F6E56', [Validators.required, Validators.pattern(HEX)]],
    accentColor: ['#D85A30', [Validators.required, Validators.pattern(HEX)]],
    headingFont: ['', Validators.required],
    bodyFont: ['', Validators.required],
    timezone: ['Asia/Kolkata', Validators.required],
    currencyCode: ['INR', Validators.required],
    dateFormat: ['d MMM y', Validators.required],
    supportEmail: ['', Validators.email],
    supportPhone: [''],
    instagram: [''],
    facebook: [''],
    twitter: [''],
    linkedin: [''],
    youtube: [''],
  });

  constructor() {
    this.load();
    // Live-preview: recolour the admin as the brand colours / fonts change.
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.preview());
  }

  ngOnDestroy(): void {
    // Revert any unsaved preview back to what's persisted.
    if (this.saved) {
      this.brandingSvc.apply(this.saved);
    }
  }

  setTab(t: Tab): void {
    this.tab.set(t);
  }

  load(): void {
    this.loading.set(true);
    this.errored.set(false);
    this.api.get().subscribe({
      next: (b) => {
        this.saved = b;
        this.logoPreview.set(b.logoUrl ?? null);
        this.form.patchValue({
          siteName: b.siteName,
          tagline: b.tagline ?? '',
          primaryColor: this.normHex(b.primaryColor, '#0F6E56'),
          accentColor: this.normHex(b.accentColor, '#D85A30'),
          headingFont: b.headingFont,
          bodyFont: b.bodyFont,
          timezone: b.timezone,
          currencyCode: b.currencyCode,
          dateFormat: b.dateFormat,
          supportEmail: b.supportEmail ?? '',
          supportPhone: b.supportPhone ?? '',
          instagram: b.socialLinks?.['instagram'] ?? '',
          facebook: b.socialLinks?.['facebook'] ?? '',
          twitter: b.socialLinks?.['twitter'] ?? '',
          linkedin: b.socialLinks?.['linkedin'] ?? '',
          youtube: b.socialLinks?.['youtube'] ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.errored.set(true);
        this.loading.set(false);
      },
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > 512 * 1024) {
      this.toast.error('Logo must be under 512 KB. Use a smaller image or a hosted URL.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.logoPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  clearLogo(): void {
    this.logoPreview.set(null);
  }

  /** Build the branding payload from the form (logo from preview; social from the named fields). */
  private toBranding(): Branding {
    const v = this.form.getRawValue();
    const social: Record<string, string> = {};
    (['instagram', 'facebook', 'twitter', 'linkedin', 'youtube'] as const).forEach((k) => {
      const val = (v[k] ?? '').trim();
      if (val) {
        social[k] = val;
      }
    });
    return {
      siteName: v.siteName.trim(),
      tagline: v.tagline.trim() || null,
      logoUrl: this.logoPreview(),
      primaryColor: v.primaryColor,
      accentColor: v.accentColor,
      headingFont: v.headingFont,
      bodyFont: v.bodyFont,
      timezone: v.timezone,
      currencyCode: v.currencyCode,
      dateFormat: v.dateFormat,
      supportEmail: v.supportEmail.trim() || null,
      supportPhone: v.supportPhone.trim() || null,
      socialLinks: social,
    };
  }

  private preview(): void {
    if (HEX.test(this.form.controls.primaryColor.value) && HEX.test(this.form.controls.accentColor.value)) {
      this.brandingSvc.apply(this.toBranding());
    }
  }

  save(): void {
    if (this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Please fix the highlighted fields.');
      return;
    }
    this.saving.set(true);
    this.api.update(this.toBranding()).subscribe({
      next: (b) => {
        this.saved = b;
        this.brandingSvc.apply(b);
        this.saving.set(false);
        this.toast.success('Settings saved — your branding is live.');
      },
      error: (err: unknown) => {
        this.saving.set(false);
        const e = err as { error?: { message?: string } };
        this.toast.error(e?.error?.message ?? 'Could not save settings.');
      },
    });
  }

  resetToSaved(): void {
    if (this.saved) {
      this.logoPreview.set(this.saved.logoUrl ?? null);
      this.load();
      this.brandingSvc.apply(this.saved);
    }
  }

  private normHex(value: string | undefined, fallback: string): string {
    return value && HEX.test(value) ? value : fallback;
  }
}
