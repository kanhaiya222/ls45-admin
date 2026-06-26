import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BookingAdminService } from '../../core/booking-admin.service';
import { Booking, PaymentRecord } from '../../core/models';
import { ListStateComponent } from '../../shared/list-state/list-state';

@Component({
  selector: 'app-admin-bookings',
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, ListStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bookings.html',
  styleUrl: './bookings.scss',
})
export class BookingsPage {
  private readonly bookingsApi = inject(BookingAdminService);
  private readonly fb = inject(FormBuilder);

  readonly items = signal<Booking[]>([]);
  readonly loading = signal(true);
  readonly errored = signal(false);
  readonly last = signal(true);
  readonly loadingMore = signal(false);
  private page = 0;

  readonly expandedId = signal<string | null>(null);
  readonly payments = signal<Record<string, PaymentRecord[]>>({});
  readonly loadingPaymentsId = signal<string | null>(null);

  readonly cancelingId = signal<string | null>(null);
  readonly cancelling = signal(false);
  readonly cancelForm = this.fb.nonNullable.group({ reason: [''] });

  constructor() {
    this.load(0);
  }

  load(page: number): void {
    if (page === 0) {
      this.loading.set(true);
      this.errored.set(false);
    } else {
      this.loadingMore.set(true);
    }
    this.bookingsApi.list(page, 20).subscribe({
      next: (res) => {
        this.items.update((cur) => (page === 0 ? res.content : [...cur, ...res.content]));
        this.last.set(res.last);
        this.page = res.page;
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.errored.set(true);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
    });
  }

  loadMore(): void {
    if (this.loadingMore() || this.last()) {
      return;
    }
    this.load(this.page + 1);
  }

  togglePayments(booking: Booking): void {
    this.cancelingId.set(null);
    if (this.expandedId() === booking.publicId) {
      this.expandedId.set(null);
      return;
    }
    this.expandedId.set(booking.publicId);
    if (this.payments()[booking.publicId]) {
      return;
    }
    this.loadingPaymentsId.set(booking.publicId);
    this.bookingsApi.getPayments(booking.publicId).subscribe({
      next: (list) => {
        this.payments.update((map) => ({ ...map, [booking.publicId]: list }));
        this.loadingPaymentsId.set(null);
      },
      error: () => {
        this.payments.update((map) => ({ ...map, [booking.publicId]: [] }));
        this.loadingPaymentsId.set(null);
      },
    });
  }

  paymentsFor(id: string): PaymentRecord[] {
    return this.payments()[id] ?? [];
  }

  startCancel(booking: Booking): void {
    this.expandedId.set(null);
    this.cancelForm.reset({ reason: '' });
    this.cancelingId.set(this.cancelingId() === booking.publicId ? null : booking.publicId);
  }

  confirmCancel(booking: Booking): void {
    if (this.cancelling()) {
      return;
    }
    this.cancelling.set(true);
    const reason = this.cancelForm.getRawValue().reason.trim() || undefined;
    this.bookingsApi.cancel(booking.publicId, reason).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.cancelingId.set(null);
        this.load(0);
      },
      error: () => this.cancelling.set(false),
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'is-confirmed';
      case 'PENDING_PAYMENT':
        return 'is-pending';
      case 'CANCELLED':
        return 'is-cancelled';
      default:
        return '';
    }
  }

  label(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}
