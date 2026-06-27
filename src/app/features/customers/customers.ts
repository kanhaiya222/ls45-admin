import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminUser } from '../../core/models';
import { UserAdminService } from '../../core/user-admin.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';
import { ListStateComponent } from '../../shared/list-state/list-state';

/**
 * Customers — buyers who self-registered on the web/mobile apps (audience=CUSTOMER). Read-mostly:
 * search, view contact details, and suspend/reactivate an account. Roles are managed on the Team
 * screen, not here.
 */
@Component({
  selector: 'app-customers',
  imports: [DatePipe, ListStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customers.html',
  styleUrl: './customers.scss',
})
export class CustomersPage {
  private readonly usersApi = inject(UserAdminService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly items = signal<AdminUser[]>([]);
  readonly loading = signal(true);
  readonly errored = signal(false);
  readonly last = signal(true);
  readonly loadingMore = signal(false);
  private page = 0;

  readonly search = signal('');

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
    this.usersApi
      .list({ page, size: 20, search: this.search(), audience: 'CUSTOMER' })
      .subscribe({
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

  applySearch(value: string): void {
    this.search.set(value);
    this.load(0);
  }

  async setStatus(u: AdminUser, suspend: boolean): Promise<void> {
    if (suspend) {
      const ok = await this.confirm.ask({
        title: `Suspend ${u.firstName} ${u.lastName}?`,
        message: 'They will be blocked from signing in until reactivated. Bookings are retained.',
        confirmText: 'Suspend',
        danger: true,
      });
      if (!ok) {
        return;
      }
    }
    const op = suspend ? this.usersApi.suspend(u.publicId) : this.usersApi.activate(u.publicId);
    op.subscribe({
      next: () => {
        this.items.update((list) =>
          list.map((x) =>
            x.publicId === u.publicId ? { ...x, status: suspend ? 'SUSPENDED' : 'ACTIVE' } : x,
          ),
        );
        this.toast.success(suspend ? 'Customer suspended' : 'Customer reactivated');
      },
      error: (err: unknown) => {
        const e = err as { error?: { message?: string } };
        this.toast.error(e?.error?.message ?? 'Operation failed. Please try again.');
      },
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'is-confirmed';
      case 'SUSPENDED':
        return 'is-cancelled';
      default:
        return 'is-pending';
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
