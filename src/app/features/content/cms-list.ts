import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { CmsAdminService } from '../../core/cms-admin.service';
import { CmsPageListItem } from '../../core/models';

@Component({
  selector: 'app-admin-cms-list',
  imports: [DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cms-list.html',
  styleUrl: './cms-list.scss',
})
export class CmsListPage {
  private readonly api = inject(CmsAdminService);

  readonly statuses = ['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'];
  readonly activeStatus = signal('ALL');

  readonly items = signal<CmsPageListItem[]>([]);
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

  publish(p: CmsPageListItem): void {
    this.act(p.publicId, this.api.publish(p.publicId));
  }

  archive(p: CmsPageListItem): void {
    this.act(p.publicId, this.api.archive(p.publicId));
  }

  remove(p: CmsPageListItem): void {
    this.act(p.publicId, this.api.delete(p.publicId));
  }

  private act(publicId: string, action$: Observable<void>): void {
    if (this.actingId()) {
      return;
    }
    this.actingId.set(publicId);
    action$.subscribe({
      next: () => {
        this.actingId.set(null);
        this.load(0);
      },
      error: () => this.actingId.set(null),
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'PUBLISHED':
        return 'is-published';
      case 'DRAFT':
        return 'is-draft';
      case 'ARCHIVED':
        return 'is-archived';
      default:
        return '';
    }
  }
}
