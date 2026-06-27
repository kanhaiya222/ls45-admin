import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { PackageAdminService } from '../../core/package-admin.service';
import { PackageListItem } from '../../core/models';
import { ListStateComponent } from '../../shared/list-state/list-state';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';

@Component({
  selector: 'app-admin-package-list',
  imports: [DecimalPipe, RouterLink, ListStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './package-list.html',
  styleUrl: './package-list.scss',
})
export class PackageListPage {
  private readonly packagesApi = inject(PackageAdminService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly statuses = ['ALL', 'DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'];
  readonly activeStatus = signal('ALL');

  readonly items = signal<PackageListItem[]>([]);
  readonly loading = signal(true);
  readonly errored = signal(false);
  readonly last = signal(true);
  readonly loadingMore = signal(false);
  readonly actingId = signal<string | null>(null);
  private page = 0;

  readonly selected = signal<Set<string>>(new Set<string>());
  readonly selectedCount = computed(() => this.selected().size);
  readonly allSelected = computed(
    () => this.items().length > 0 && this.items().every((p) => this.selected().has(p.publicId)),
  );
  readonly bulkBusy = signal(false);

  constructor() {
    this.load(0);
  }

  selectStatus(status: string): void {
    if (this.activeStatus() === status) {
      return;
    }
    this.activeStatus.set(status);
    this.clearSelection();
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
      next: () => {
        this.toast.success(`${pkg.name} published`);
        this.afterAction();
      },
      error: () => {
        this.toast.error('Could not publish the package');
        this.actingId.set(null);
      },
    });
  }

  async archive(pkg: PackageListItem): Promise<void> {
    if (this.actingId()) {
      return;
    }
    const ok = await this.confirm.ask({
      title: 'Archive this package?',
      message: `${pkg.name} will be hidden from the catalogue. You can republish it later.`,
      confirmText: 'Archive',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.actingId.set(pkg.publicId);
    this.packagesApi.archive(pkg.publicId).subscribe({
      next: () => {
        this.toast.success(`${pkg.name} archived`);
        this.afterAction();
      },
      error: () => {
        this.toast.error('Could not archive the package');
        this.actingId.set(null);
      },
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

  // ---- bulk selection ----
  isSelected(id: string): boolean {
    return this.selected().has(id);
  }

  toggleOne(id: string): void {
    this.selected.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  toggleAll(): void {
    const all = this.items();
    this.selected.update((set) =>
      all.every((p) => set.has(p.publicId)) ? new Set<string>() : new Set(all.map((p) => p.publicId)),
    );
  }

  clearSelection(): void {
    this.selected.set(new Set<string>());
  }

  bulkPublish(): void {
    const targets = this.items().filter((p) => this.selected().has(p.publicId) && this.canPublish(p.status));
    if (targets.length) {
      this.runBulk(targets, (p) => this.packagesApi.publish(p.publicId), 'published');
    }
  }

  async bulkArchive(): Promise<void> {
    const targets = this.items().filter((p) => this.selected().has(p.publicId) && p.status === 'PUBLISHED');
    if (!targets.length) {
      return;
    }
    const ok = await this.confirm.ask({
      title: `Archive ${targets.length} package${targets.length > 1 ? 's' : ''}?`,
      message: 'They will be hidden from the catalogue. You can republish them later.',
      confirmText: 'Archive',
      danger: true,
    });
    if (ok) {
      this.runBulk(targets, (p) => this.packagesApi.archive(p.publicId), 'archived');
    }
  }

  private runBulk(
    targets: PackageListItem[],
    op: (p: PackageListItem) => Observable<void>,
    verb: string,
  ): void {
    this.bulkBusy.set(true);
    forkJoin(targets.map((p) => op(p).pipe(map(() => true), catchError(() => of(false))))).subscribe(
      (results) => {
        const done = results.filter(Boolean).length;
        const failed = results.length - done;
        this.bulkBusy.set(false);
        this.clearSelection();
        if (done) {
          this.toast.success(`${done} package${done > 1 ? 's' : ''} ${verb}`);
        }
        if (failed) {
          this.toast.error(`${failed} could not be ${verb}`);
        }
        this.load(0);
      },
    );
  }
}
