import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandPricePipe } from '../../core/brand-price.pipe';
import { ProductAdminService } from '../../core/product-admin.service';
import { ProductListItem } from '../../core/models';
import { ListStateComponent } from '../../shared/list-state/list-state';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';

@Component({
  selector: 'app-admin-product-list',
  imports: [BrandPricePipe, RouterLink, ListStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductListPage {
  private readonly productsApi = inject(ProductAdminService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly statuses = ['ALL', 'DRAFT', 'ACTIVE', 'ARCHIVED'];
  readonly activeStatus = signal('ALL');

  readonly items = signal<ProductListItem[]>([]);
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
    this.productsApi.list(status, page).subscribe({
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

  publish(p: ProductListItem): void {
    if (this.actingId()) {
      return;
    }
    this.actingId.set(p.publicId);
    this.productsApi.publish(p.publicId).subscribe({
      next: () => {
        this.toast.success(`${p.name} published`);
        this.afterAction();
      },
      error: () => {
        this.toast.error('Could not publish the product');
        this.actingId.set(null);
      },
    });
  }

  async archive(p: ProductListItem): Promise<void> {
    if (this.actingId()) {
      return;
    }
    const ok = await this.confirm.ask({
      title: 'Archive this product?',
      message: `${p.name} will be hidden from the Shop. You can republish it later.`,
      confirmText: 'Archive',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.actingId.set(p.publicId);
    this.productsApi.archive(p.publicId).subscribe({
      next: () => {
        this.toast.success(`${p.name} archived`);
        this.afterAction();
      },
      error: () => {
        this.toast.error('Could not archive the product');
        this.actingId.set(null);
      },
    });
  }

  async remove(p: ProductListItem): Promise<void> {
    if (this.actingId()) {
      return;
    }
    const ok = await this.confirm.ask({
      title: 'Delete this product?',
      message: `${p.name} will be removed. This cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.actingId.set(p.publicId);
    this.productsApi.delete(p.publicId).subscribe({
      next: () => {
        this.toast.success(`${p.name} deleted`);
        this.afterAction();
      },
      error: () => {
        this.toast.error('Could not delete the product');
        this.actingId.set(null);
      },
    });
  }

  private afterAction(): void {
    this.actingId.set(null);
    this.load(0);
  }

  statusClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
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
