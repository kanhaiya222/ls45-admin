import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DepartureAdminService } from '../../core/departure-admin.service';
import { PackageAdminService } from '../../core/package-admin.service';
import { CreateDeparturePayload, DepartureSummary, OccupancyType } from '../../core/models';
import { ListStateComponent } from '../../shared/list-state/list-state';

interface PriceField {
  control: 'priceSingle' | 'priceDouble' | 'priceTriple' | 'priceQuad';
  occupancy: OccupancyType;
  label: string;
}

@Component({
  selector: 'app-admin-departures',
  imports: [ReactiveFormsModule, RouterLink, ListStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './departures.html',
  styleUrl: './departures.scss',
})
export class DeparturesPage {
  private readonly fb = inject(FormBuilder);
  private readonly departuresApi = inject(DepartureAdminService);
  private readonly packagesApi = inject(PackageAdminService);
  private readonly route = inject(ActivatedRoute);

  readonly packagePublicId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly packageName = signal<string>('');
  readonly items = signal<DepartureSummary[]>([]);
  readonly loading = signal(true);
  readonly errored = signal(false);
  readonly actingId = signal<string | null>(null);

  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly priceFields: PriceField[] = [
    { control: 'priceSingle', occupancy: 'SINGLE', label: 'Single' },
    { control: 'priceDouble', occupancy: 'DOUBLE_SHARING', label: 'Double sharing' },
    { control: 'priceTriple', occupancy: 'TRIPLE_SHARING', label: 'Triple sharing' },
    { control: 'priceQuad', occupancy: 'QUAD_SHARING', label: 'Quad sharing' },
  ];

  readonly form = this.fb.nonNullable.group({
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    bookingCutoffDate: ['', [Validators.required]],
    totalCapacity: [12, [Validators.required, Validators.min(1)]],
    specialNotes: [''],
    priceSingle: [0],
    priceDouble: [0],
    priceTriple: [0],
    priceQuad: [0],
  });

  constructor() {
    this.load();
    this.packagesApi.get(this.packagePublicId).subscribe({
      next: (pkg) => this.packageName.set(pkg.name),
      error: () => this.packageName.set(''),
    });
  }

  load(): void {
    this.loading.set(true);
    this.errored.set(false);
    this.departuresApi.listForPackage(this.packagePublicId).subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.errored.set(true);
        this.loading.set(false);
      },
    });
  }

  toggleForm(): void {
    this.showForm.update((open) => !open);
    this.saveError.set(null);
  }

  submit(): void {
    if (this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const pricing = this.collectPricing();
    if (pricing.length === 0) {
      this.saveError.set('Enter a price for at least one occupancy type.');
      return;
    }
    this.saving.set(true);
    this.saveError.set(null);
    const raw = this.form.getRawValue();
    const payload: CreateDeparturePayload = {
      packagePublicId: this.packagePublicId,
      startDate: raw.startDate,
      endDate: raw.endDate,
      bookingCutoffDate: raw.bookingCutoffDate,
      totalCapacity: Number(raw.totalCapacity),
      specialNotes: raw.specialNotes.trim() || undefined,
      pricing,
    };
    this.departuresApi.create(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset({ totalCapacity: 12, priceSingle: 0, priceDouble: 0, priceTriple: 0, priceQuad: 0 });
        this.showForm.set(false);
        this.load();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(this.messageFrom(err));
      },
    });
  }

  private collectPricing(): { occupancyType: OccupancyType; price: number }[] {
    const raw = this.form.getRawValue();
    const map: Record<PriceField['control'], number> = {
      priceSingle: Number(raw.priceSingle),
      priceDouble: Number(raw.priceDouble),
      priceTriple: Number(raw.priceTriple),
      priceQuad: Number(raw.priceQuad),
    };
    return this.priceFields
      .filter((f) => map[f.control] > 0)
      .map((f) => ({ occupancyType: f.occupancy, price: map[f.control] }));
  }

  close(d: DepartureSummary): void {
    this.act(d.publicId, this.departuresApi.close(d.publicId));
  }

  reopen(d: DepartureSummary): void {
    this.act(d.publicId, this.departuresApi.reopen(d.publicId));
  }

  cancel(d: DepartureSummary): void {
    this.act(d.publicId, this.departuresApi.cancel(d.publicId));
  }

  private act(publicId: string, action$: ReturnType<DepartureAdminService['close']>): void {
    if (this.actingId()) {
      return;
    }
    this.actingId.set(publicId);
    action$.subscribe({
      next: () => {
        this.actingId.set(null);
        this.load();
      },
      error: () => this.actingId.set(null),
    });
  }

  canClose(status: string): boolean {
    return status === 'OPEN' || status === 'WAITLIST_ONLY';
  }

  canReopen(status: string): boolean {
    return status === 'CLOSED';
  }

  canCancel(status: string): boolean {
    return status !== 'CANCELLED' && status !== 'COMPLETED';
  }

  statusClass(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'is-open';
      case 'WAITLIST_ONLY':
        return 'is-waitlist';
      case 'CLOSED':
        return 'is-closed';
      case 'CANCELLED':
        return 'is-cancelled';
      case 'COMPLETED':
        return 'is-completed';
      default:
        return '';
    }
  }

  statusLabel(status: string): string {
    return status
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private messageFrom(err: unknown): string {
    const e = err as { error?: { message?: string } };
    return e?.error?.message ?? 'Could not save the departure. Please review the dates and try again.';
  }
}
