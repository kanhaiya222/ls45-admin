import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BrandPricePipe } from '../../core/brand-price.pipe';
import { BrandDatePipe } from '../../core/brand-date.pipe';
import { OrderAdminService } from '../../core/order-admin.service';
import { ToastService } from '../../core/toast.service';
import { AdminOrder, FulfillmentLocation, Shipment, ShipmentStatus } from '../../core/models';

/** Next shipment status offered for the current one (drives the quick-action buttons). */
const NEXT_SHIPMENT: Record<string, { status: ShipmentStatus; label: string }[]> = {
  PENDING: [
    { status: 'PACKED', label: 'Mark packed' },
    { status: 'CANCELLED', label: 'Cancel' },
  ],
  PACKED: [{ status: 'DISPATCHED', label: 'Mark dispatched' }],
  DISPATCHED: [{ status: 'DELIVERED', label: 'Mark delivered' }],
};

@Component({
  selector: 'app-admin-order-detail',
  imports: [ReactiveFormsModule, RouterLink, BrandPricePipe, BrandDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss',
})
export class OrderDetailPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(OrderAdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly publicId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly order = signal<AdminOrder | null>(null);
  readonly shipments = signal<Shipment[]>([]);
  readonly locations = signal<FulfillmentLocation[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  readonly creating = signal(false);
  readonly actingShipmentId = signal<string | null>(null);

  readonly shipForm = this.fb.nonNullable.group({
    fulfillmentLocationPublicId: [''],
    carrier: [''],
    trackingNumber: [''],
  });

  /** Whether new shipments can still be created for this order's status. */
  readonly canFulfil = computed(() => {
    const s = this.order()?.status;
    return s === 'CONFIRMED' || s === 'FULFILLING' || s === 'SHIPPED';
  });

  readonly awaitingPayment = computed(() => this.order()?.status === 'PENDING_PAYMENT');

  constructor() {
    this.reload();
    this.api.listLocations().subscribe({
      next: (l) => this.locations.set(l),
      error: () => this.locations.set([]),
    });
  }

  reload(): void {
    this.api.get(this.publicId).subscribe({
      next: (o) => {
        this.order.set(o);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
    this.api.listOrderShipments(this.publicId).subscribe({
      next: (s) => this.shipments.set(s),
      error: () => this.shipments.set([]),
    });
  }

  createShipment(): void {
    if (this.creating()) {
      return;
    }
    this.creating.set(true);
    const raw = this.shipForm.getRawValue();
    this.api
      .createShipment(this.publicId, {
        fulfillmentLocationPublicId: raw.fulfillmentLocationPublicId || undefined,
        carrier: raw.carrier.trim() || undefined,
        trackingNumber: raw.trackingNumber.trim() || undefined,
      })
      .subscribe({
        next: (shipment) => {
          this.shipments.update((cur) => [...cur, shipment]);
          this.shipForm.reset({ fulfillmentLocationPublicId: '', carrier: '', trackingNumber: '' });
          this.creating.set(false);
          this.toast.success('Shipment created');
          this.reload();
        },
        error: (err: unknown) => {
          this.creating.set(false);
          this.toast.error(this.messageFrom(err, 'Could not create the shipment.'));
        },
      });
  }

  nextActions(status: string): { status: ShipmentStatus; label: string }[] {
    return NEXT_SHIPMENT[status] ?? [];
  }

  setShipmentStatus(shipment: Shipment, status: ShipmentStatus): void {
    if (this.actingShipmentId()) {
      return;
    }
    this.actingShipmentId.set(shipment.publicId);
    this.api.updateShipmentStatus(shipment.publicId, { status }).subscribe({
      next: (updated) => {
        this.shipments.update((cur) => cur.map((s) => (s.publicId === updated.publicId ? updated : s)));
        this.actingShipmentId.set(null);
        this.toast.success('Shipment updated');
        this.reload();
      },
      error: () => {
        this.actingShipmentId.set(null);
        this.toast.error('Could not update the shipment');
      },
    });
  }

  statusLabel(status: string): string {
    return status
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  orderStatusClass(status: string): string {
    switch (status) {
      case 'DELIVERED':
      case 'CONFIRMED':
        return 'is-published';
      case 'SHIPPED':
      case 'FULFILLING':
        return 'is-review';
      case 'PENDING_PAYMENT':
        return 'is-draft';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'is-archived';
      default:
        return '';
    }
  }

  private messageFrom(err: unknown, fallback: string): string {
    const e = err as { error?: { message?: string } };
    return e?.error?.message ?? fallback;
  }
}
