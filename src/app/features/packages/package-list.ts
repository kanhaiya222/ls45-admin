import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PackageAdminService } from '../../core/package-admin.service';
import { PackageListItem } from '../../core/models';
import { ListStateComponent } from '../../shared/list-state/list-state';

@Component({
  selector: 'app-admin-package-list',
  imports: [DecimalPipe, RouterLink, ListStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './package-list.html',
  styleUrl: './package-list.scss',
})
export class PackageListPage {
  private readonly packagesApi = inject(PackageAdminService);

  readonly statuses = ['ALL', 'DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'];
  readonly activeStatus = signal('ALL');

  readonly items = signal<PackageListItem[]>([]);
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
    this.packagesApi.list(status, page).subscribe({
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

  publish(pkg: PackageListItem): void {
    if (this.actingId()) {
      return;
    }
    this.actingId.set(pkg.publicId);
    this.packagesApi.publish(pkg.publicId).subscribe({
      next: () => this.afterAction(),
      error: () => this.actingId.set(null),
    });
  }

  archive(pkg: PackageListItem): void {
    if (this.actingId()) {
      return;
    }
    this.actingId.set(pkg.publicId);
    this.packagesApi.archive(pkg.publicId).subscribe({
      next: () => this.afterAction(),
      error: () => this.actingId.set(null),
    });
  }

  private afterAction(): void {
    this.actingId.set(null);
    // Reload the current filter so the row reflects its new status (and leaves a filtered view).
    this.load(0);
  }

  statusClass(status: string): string {
    switch (status) {
      case 'PUBLISHED':
        return 'is-published';
      case 'DRAFT':
        return 'is-draft';
      case 'REVIEW':
        return 'is-review';
      case 'ARCHIVED':
        return 'is-archived';
      default:
        return '';
    }
  }

  canPublish(status: string): boolean {
    return status === 'DRAFT' || status === 'REVIEW';
  }
}
