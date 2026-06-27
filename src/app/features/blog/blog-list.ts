import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BrandDatePipe } from '../../core/brand-date.pipe';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { BlogAdminService } from '../../core/blog-admin.service';
import { BlogPostListItem } from '../../core/models';
import { ListStateComponent } from '../../shared/list-state/list-state';

@Component({
  selector: 'app-admin-blog-list',
  imports: [BrandDatePipe, RouterLink, ListStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-list.html',
  styleUrl: './blog-list.scss',
})
export class BlogListPage {
  private readonly api = inject(BlogAdminService);

  readonly statuses = ['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'];
  readonly activeStatus = signal('ALL');

  readonly items = signal<BlogPostListItem[]>([]);
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
    this.api.listPosts(status, page).subscribe({
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

  publish(p: BlogPostListItem): void {
    this.act(p.publicId, this.api.publishPost(p.publicId));
  }

  archive(p: BlogPostListItem): void {
    this.act(p.publicId, this.api.archivePost(p.publicId));
  }

  remove(p: BlogPostListItem): void {
    this.act(p.publicId, this.api.deletePost(p.publicId));
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
