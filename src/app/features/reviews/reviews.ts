import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BrandDatePipe } from '../../core/brand-date.pipe';
import { ReviewAdminService } from '../../core/review-admin.service';
import { ToastService } from '../../core/toast.service';
import { AdminReview, ReviewStatus } from '../../core/models';
import { ListStateComponent } from '../../shared/list-state/list-state';

@Component({
  selector: 'app-admin-reviews',
  imports: [BrandDatePipe, ListStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reviews.html',
  styleUrl: './reviews.scss',
})
export class ReviewsPage {
  private readonly api = inject(ReviewAdminService);
  private readonly toast = inject(ToastService);

  readonly statuses = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'];
  readonly activeStatus = signal('PENDING');
  readonly stars = [1, 2, 3, 4, 5];

  readonly items = signal<AdminReview[]>([]);
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

  approve(r: AdminReview): void {
    this.act(r, 'approve');
  }

  reject(r: AdminReview): void {
    this.act(r, 'reject');
  }

  private act(r: AdminReview, action: 'approve' | 'reject'): void {
    if (this.actingId()) {
      return;
    }
    this.actingId.set(r.publicId);
    const op$ = action === 'approve' ? this.api.approve(r.publicId) : this.api.reject(r.publicId);
    op$.subscribe({
      next: (updated) => {
        this.actingId.set(null);
        this.toast.success(`Review ${updated.status.toLowerCase()}`);
        // If filtering by a status this review no longer matches, drop it; else update in place.
        const filter = this.activeStatus();
        if (filter !== 'ALL' && updated.status !== filter) {
          this.items.update((list) => list.filter((x) => x.publicId !== r.publicId));
        } else {
          this.items.update((list) => list.map((x) => (x.publicId === r.publicId ? updated : x)));
        }
      },
      error: () => {
        this.actingId.set(null);
        this.toast.error(`Could not ${action} the review`);
      },
    });
  }

  filled(reviewRating: number, star: number): boolean {
    return star <= reviewRating;
  }

  label(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  statusClass(status: ReviewStatus): string {
    switch (status) {
      case 'APPROVED': return 'is-published';
      case 'PENDING': return 'is-review';
      case 'REJECTED': return 'is-archived';
      default: return '';
    }
  }
}
