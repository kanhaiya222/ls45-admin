import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandPricePipe } from '../../core/brand-price.pipe';
import { BrandDatePipe } from '../../core/brand-date.pipe';
import { OrderAdminService } from '../../core/order-admin.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';
import { ReturnRequest, ReturnStatus } from '../../core/models';
import { ListStateComponent } from '../../shared/list-state/list-state';

type Action = 'approve' | 'reject' | 'receive' | 'refund';

const NEXT_ACTIONS: Record<string, { action: Action; label: string; danger?: boolean }[]> = {
  REQUESTED: [
    { action: 'approve', label: 'Approve' },
    { action: 'reject', label: 'Reject', danger: true },
  ],
  APPROVED: [{ action: 'receive', label: 'Mark received' }],
  RECEIVED: [{ action: 'refund', label: 'Refund' }],
};

@Component({
  selector: 'app-admin-returns',
  imports: [BrandPricePipe, BrandDatePipe, RouterLink, ListStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './returns.html',
  styleUrl: './returns.scss',
})
export class ReturnsPage {
  private readonly api = inject(OrderAdminService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly statuses = ['ALL', 'REQUESTED', 'APPROVED', 'RECEIVED', 'REFUNDED', 'REJECTED'];
  readonly activeStatus = signal('ALL');

  readonly items = signal<ReturnRequest[]>([]);
  readonly loading = signal(true);
  readonly errored = signal(false);
  readonly last = signal(true);
  readonly loadingMore = signal(false);
  readonly actingId = signal<string | null>(null);
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
    this.api.listReturns(status, page).subscribe({
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

  actionsFor(status: string): { action: Action; label: string; danger?: boolean }[] {
    return NEXT_ACTIONS[status] ?? [];
  }

  async act(ret: ReturnRequest, action: Action, danger?: boolean): Promise<void> {
    if (this.actingId()) {
      return;
    }
    if (action === 'refund' || danger) {
      const ok = await this.confirm.ask({
        title: action === 'refund' ? 'Issue refund?' : 'Reject this return?',
        message:
          action === 'refund'
            ? `Refund ${ret.refundAmount ?? ''} for this return. This cannot be undone.`
            : 'The customer will be notified the return was rejected.',
        confirmText: action === 'refund' ? 'Refund' : 'Reject',
        danger: true,
      });
      if (!ok) {
        return;
      }
    }
    this.actingId.set(ret.publicId);
    this.api.returnAction(ret.publicId, action).subscribe({
      next: (updated) => {
        this.items.update((cur) => cur.map((r) => (r.publicId === updated.publicId ? updated : r)));
        this.actingId.set(null);
        this.toast.success(`Return ${updated.status.toLowerCase()}`);
      },
      error: () => {
        this.actingId.set(null);
        this.toast.error('Could not update the return');
      },
    });
  }

  label(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  statusClass(status: ReturnStatus): string {
    switch (status) {
      case 'REFUNDED':
      case 'RECEIVED':
        return 'is-published';
      case 'APPROVED':
        return 'is-review';
      case 'REQUESTED':
        return 'is-draft';
      case 'REJECTED':
        return 'is-archived';
      default:
        return '';
    }
  }
}
