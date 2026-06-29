import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CollectionAdminService } from '../../core/collection-admin.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmService } from '../../core/confirm.service';
import { AdminCollectionListItem } from '../../core/models';
import { ListStateComponent } from '../../shared/list-state/list-state';

@Component({
  selector: 'app-admin-collection-list',
  imports: [RouterLink, ListStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './collection-list.html',
  styleUrl: './collection-list.scss',
})
export class CollectionListPage {
  private readonly api = inject(CollectionAdminService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly items = signal<AdminCollectionListItem[]>([]);
  readonly loading = signal(true);
  readonly errored = signal(false);
  readonly actingId = signal<string | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errored.set(false);
    this.api.list().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.errored.set(true);
        this.loading.set(false);
      },
    });
  }

  publish(c: AdminCollectionListItem): void {
    if (this.actingId()) {
      return;
    }
    this.actingId.set(c.publicId);
    this.api.publish(c.publicId).subscribe({
      next: () => {
        this.toast.success(`${c.name} published`);
        this.actingId.set(null);
        this.load();
      },
      error: () => {
        this.toast.error('Could not publish the collection');
        this.actingId.set(null);
      },
    });
  }

  async archive(c: AdminCollectionListItem): Promise<void> {
    if (this.actingId()) {
      return;
    }
    const ok = await this.confirm.ask({
      title: 'Archive this collection?',
      message: `${c.name} will be hidden from the Shop. You can republish it later.`,
      confirmText: 'Archive',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.actingId.set(c.publicId);
    this.api.archive(c.publicId).subscribe({
      next: () => {
        this.toast.success(`${c.name} archived`);
        this.actingId.set(null);
        this.load();
      },
      error: () => {
        this.toast.error('Could not archive the collection');
        this.actingId.set(null);
      },
    });
  }

  async remove(c: AdminCollectionListItem): Promise<void> {
    if (this.actingId()) {
      return;
    }
    const ok = await this.confirm.ask({
      title: 'Delete this collection?',
      message: `${c.name} will be removed. This cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.actingId.set(c.publicId);
    this.api.delete(c.publicId).subscribe({
      next: () => {
        this.toast.success(`${c.name} deleted`);
        this.actingId.set(null);
        this.load();
      },
      error: () => {
        this.toast.error('Could not delete the collection');
        this.actingId.set(null);
      },
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'is-published';
      case 'ARCHIVED': return 'is-archived';
      default: return 'is-draft';
    }
  }
}
