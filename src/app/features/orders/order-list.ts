import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandPricePipe } from '../../core/brand-price.pipe';
import { BrandDatePipe } from '../../core/brand-date.pipe';
import { OrderAdminService } from '../../core/order-admin.service';
import { AdminOrderListItem } from '../../core/models';
import { ListStateComponent } from '../../shared/list-state/list-state';

const STATUSES = [
  'ALL', 'PENDING_PAYMENT', 'CONFIRMED', 'FULFILLING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED',
];

@Component({
  selector: 'app-admin-order-list',
  imports: [BrandPricePipe, BrandDatePipe, RouterLink, ListStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss',
})
export class OrderListPage {
  private readonly api = inject(OrderAdminService);

  readonly statuses = STATUSES;
  readonly activeStatus = signal('ALL');

  readonly items = signal<AdminOrderListItem[]>([]);
  readonly loading = signal(true);
  readonly errored = signal(false);
  readonly last = signal(true);
  readonly loadingMore = signal(false);
  private page = 0;

  constructor() {
    this.load(0);
  }

  selectStatus(status: string): void {
    if (this.activeStatus() === status) {
      return;
    }
    this.activeStatus.set(status);
    this.load(0);
  }

  load(page: number): void {
    if (page === 0) {
      this.loading.set(true);
      this.errored.set(false);
    } else {
      this.loadingMore.set(true);
    }
    const status = this.activeStatus() === 'ALL' ? null : this.activeStatus();
    this.api.list(status, page).subscribe({
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

  label(status: string): string {
    return status
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  statusClass(status: string): string {
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
}
