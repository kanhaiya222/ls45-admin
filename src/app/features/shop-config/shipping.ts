import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrandPricePipe } from '../../core/brand-price.pipe';
import { ShippingAdminService } from '../../core/shipping-admin.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';
import { ShippingMethod, ShippingRate, ShippingZone } from '../../core/models';

@Component({
  selector: 'app-admin-shipping',
  imports: [ReactiveFormsModule, BrandPricePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shipping.html',
  styleUrl: './shop-config.scss',
})
export class ShippingPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ShippingAdminService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly zones = signal<ShippingZone[]>([]);
  readonly methods = signal<ShippingMethod[]>([]);
  readonly rates = signal<ShippingRate[]>([]);
  readonly selectedZoneId = signal<string>('');
  readonly busy = signal(false);

  readonly selectedZone = computed(() => this.zones().find((z) => z.publicId === this.selectedZoneId()));

  readonly zoneForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    countryCodes: ['', Validators.required],
  });
  readonly methodForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    carrier: [''],
    code: ['', Validators.required],
    sortOrder: [0],
  });
  readonly rateForm = this.fb.nonNullable.group({
    methodPublicId: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    minOrderAmount: [0],
    maxWeightGrams: [null as number | null],
    freeOverAmount: [null as number | null],
  });

  constructor() {
    this.loadZones();
    this.api.listMethods().subscribe({ next: (m) => this.methods.set(m), error: () => undefined });
  }

  private loadZones(): void {
    this.api.listZones().subscribe({
      next: (z) => {
        this.zones.set(z);
        if (z.length && !this.selectedZoneId()) {
          this.selectZone(z[0].publicId);
        }
      },
      error: () => this.zones.set([]),
    });
  }

  methodName(publicId: string): string {
    return this.methods().find((m) => m.publicId === publicId)?.name ?? '—';
  }

  // ── zones ──
  addZone(): void {
    if (this.zoneForm.invalid || this.busy()) {
      return;
    }
    this.busy.set(true);
    const raw = this.zoneForm.getRawValue();
    this.api
      .createZone({
        name: raw.name.trim(),
        code: raw.code.trim(),
        countryCodes: this.csv(raw.countryCodes),
        active: true,
      })
      .subscribe({
        next: () => {
          this.zoneForm.reset({ name: '', code: '', countryCodes: '' });
          this.busy.set(false);
          this.loadZones();
          this.toast.success('Zone added');
        },
        error: (e) => this.fail(e),
      });
  }

  toggleZone(z: ShippingZone): void {
    this.api
      .updateZone(z.publicId, { name: z.name, code: z.code, countryCodes: z.countryCodes, active: !z.active })
      .subscribe({
        next: () => this.loadZones(),
        error: () => this.toast.error('Could not update the zone'),
      });
  }

  async deleteZone(z: ShippingZone): Promise<void> {
    if (!(await this.confirmDelete(`zone "${z.name}"`))) {
      return;
    }
    this.api.deleteZone(z.publicId).subscribe({
      next: () => {
        if (this.selectedZoneId() === z.publicId) {
          this.selectedZoneId.set('');
          this.rates.set([]);
        }
        this.loadZones();
        this.toast.success('Zone deleted');
      },
      error: () => this.toast.error('Could not delete the zone'),
    });
  }

  // ── methods ──
  addMethod(): void {
    if (this.methodForm.invalid || this.busy()) {
      return;
    }
    this.busy.set(true);
    const raw = this.methodForm.getRawValue();
    this.api
      .createMethod({
        name: raw.name.trim(),
        carrier: raw.carrier.trim() || undefined,
        code: raw.code.trim(),
        sortOrder: Number(raw.sortOrder),
        active: true,
      })
      .subscribe({
        next: () => {
          this.methodForm.reset({ name: '', carrier: '', code: '', sortOrder: 0 });
          this.busy.set(false);
          this.api.listMethods().subscribe((m) => this.methods.set(m));
          this.toast.success('Method added');
        },
        error: (e) => this.fail(e),
      });
  }

  toggleMethod(m: ShippingMethod): void {
    this.api
      .updateMethod(m.publicId, {
        name: m.name, carrier: m.carrier, code: m.code, sortOrder: m.sortOrder, active: !m.active,
      })
      .subscribe({
        next: () => this.api.listMethods().subscribe((list) => this.methods.set(list)),
        error: () => this.toast.error('Could not update the method'),
      });
  }

  async deleteMethod(m: ShippingMethod): Promise<void> {
    if (!(await this.confirmDelete(`method "${m.name}"`))) {
      return;
    }
    this.api.deleteMethod(m.publicId).subscribe({
      next: () => {
        this.api.listMethods().subscribe((list) => this.methods.set(list));
        this.toast.success('Method deleted');
      },
      error: () => this.toast.error('Could not delete the method'),
    });
  }

  // ── rates ──
  selectZone(zonePublicId: string): void {
    this.selectedZoneId.set(zonePublicId);
    this.api.listRates(zonePublicId).subscribe({
      next: (r) => this.rates.set(r),
      error: () => this.rates.set([]),
    });
  }

  addRate(): void {
    if (this.rateForm.invalid || !this.selectedZoneId() || this.busy()) {
      return;
    }
    this.busy.set(true);
    const raw = this.rateForm.getRawValue();
    this.api
      .createRate({
        zonePublicId: this.selectedZoneId(),
        methodPublicId: raw.methodPublicId,
        price: Number(raw.price),
        minOrderAmount: Number(raw.minOrderAmount) || 0,
        maxWeightGrams: raw.maxWeightGrams != null ? Number(raw.maxWeightGrams) : undefined,
        freeOverAmount: raw.freeOverAmount != null ? Number(raw.freeOverAmount) : undefined,
        active: true,
      })
      .subscribe({
        next: () => {
          this.rateForm.reset({ methodPublicId: '', price: 0, minOrderAmount: 0, maxWeightGrams: null, freeOverAmount: null });
          this.busy.set(false);
          this.selectZone(this.selectedZoneId());
          this.toast.success('Rate added');
        },
        error: (e) => this.fail(e),
      });
  }

  async deleteRate(r: ShippingRate): Promise<void> {
    if (!(await this.confirmDelete('this rate'))) {
      return;
    }
    this.api.deleteRate(r.publicId).subscribe({
      next: () => {
        this.selectZone(this.selectedZoneId());
        this.toast.success('Rate deleted');
      },
      error: () => this.toast.error('Could not delete the rate'),
    });
  }

  private csv(value: string): string[] {
    return value.split(',').map((s) => s.trim().toUpperCase()).filter((s) => s.length > 0);
  }

  private confirmDelete(what: string): Promise<boolean> {
    return this.confirm.ask({
      title: 'Delete?',
      message: `Delete ${what}? This cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
    });
  }

  private fail(err: unknown): void {
    this.busy.set(false);
    const e = err as { error?: { message?: string } };
    this.toast.error(e?.error?.message ?? 'Operation failed.');
  }
}
