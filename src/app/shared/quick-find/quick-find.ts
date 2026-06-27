import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { QuickFindService } from '../../core/quick-find.service';
import { PackageAdminService } from '../../core/package-admin.service';
import { PackageListItem } from '../../core/models';

interface Command {
  readonly label: string;
  readonly hint: string;
  readonly route: string;
}

/**
 * Global command palette (Ctrl/⌘+K). Lists navigation targets always, and packages by name
 * once you type. Keyboard: ↑/↓ to move, Enter to open, Esc to close. Mounted once in the shell.
 */
@Component({
  selector: 'app-quick-find',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quick-find.html',
  styleUrl: './quick-find.scss',
})
export class QuickFindComponent {
  private readonly qf = inject(QuickFindService);
  private readonly router = inject(Router);
  private readonly packagesApi = inject(PackageAdminService);

  readonly isOpen = this.qf.isOpen;
  readonly query = signal('');
  readonly active = signal(0);

  private readonly packages = signal<PackageListItem[]>([]);
  private loaded = false;
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('qfInput');

  private readonly NAV: readonly Command[] = [
    { label: 'Dashboard', hint: 'Overview', route: '/' },
    { label: 'Packages', hint: 'Catalogue', route: '/packages' },
    { label: 'New package', hint: 'Create', route: '/packages/new' },
    { label: 'Bookings', hint: 'Operations', route: '/bookings' },
    { label: 'Reports', hint: 'Insights', route: '/reports' },
    { label: 'Taxonomy', hint: 'Catalogue', route: '/taxonomy' },
    { label: 'Pages', hint: 'Content', route: '/content/pages' },
    { label: 'Blog', hint: 'Content', route: '/content/blog' },
  ];

  readonly results = computed<Command[]>(() => {
    const q = this.query().trim().toLowerCase();
    const nav = this.NAV.filter((c) => !q || c.label.toLowerCase().includes(q));
    const pkgs = q
      ? this.packages()
          .filter((p) => p.name.toLowerCase().includes(q))
          .slice(0, 8)
          .map<Command>((p) => ({ label: p.name, hint: 'Edit package', route: `/packages/${p.publicId}/edit` }))
      : [];
    return [...nav, ...pkgs];
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.query.set('');
        this.active.set(0);
        this.ensureLoaded();
        setTimeout(() => this.input()?.nativeElement.focus(), 0);
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.qf.toggle();
      return;
    }
    if (!this.isOpen()) {
      return;
    }
    switch (e.key) {
      case 'Escape':
        this.qf.close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.move(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.move(-1);
        break;
      case 'Enter':
        e.preventDefault();
        this.go(this.results()[this.active()]);
        break;
    }
  }

  onInput(value: string): void {
    this.query.set(value);
    this.active.set(0);
  }

  setActive(index: number): void {
    this.active.set(index);
  }

  go(cmd: Command | undefined): void {
    if (!cmd) {
      return;
    }
    this.qf.close();
    this.router.navigateByUrl(cmd.route);
  }

  close(): void {
    this.qf.close();
  }

  private move(delta: number): void {
    const total = this.results().length;
    if (total) {
      this.active.set((this.active() + delta + total) % total);
    }
  }

  private ensureLoaded(): void {
    if (this.loaded) {
      return;
    }
    this.loaded = true;
    this.packagesApi.list(null, 0, 100).subscribe({
      next: (page) => this.packages.set(page.content ?? []),
      error: () => {
        /* palette still works for navigation without package results */
      },
    });
  }
}
