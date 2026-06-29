import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ReportService } from '../../core/report.service';
import { ToastContainerComponent } from '../../shared/toast/toast-container';
import { ConfirmDialogComponent } from '../../shared/confirm/confirm-dialog';
import { QuickFindComponent } from '../../shared/quick-find/quick-find';
import { QuickFindService } from '../../core/quick-find.service';
import { ThemeService } from '../../core/theme.service';
import { BrandingService } from '../../core/branding.service';

interface Crumb {
  readonly label: string;
  readonly url: string;
  readonly link: boolean;
}

/** Visibility gating shared by nav nodes + children (admins bypass perms). */
interface NavGate {
  readonly perm?: string;
  readonly adminOnly?: boolean;
  readonly superOnly?: boolean;
}

/** A child link under a parent menu. */
interface NavLeaf extends NavGate {
  readonly label: string;
  readonly route: string;
  readonly badgeKey?: string;
}

/** A top-level nav node — either a direct link (has `route`) or a parent (has `children`). */
interface NavNode extends NavGate {
  readonly label: string;
  readonly icon: string;
  readonly route?: string;
  readonly exact?: boolean;
  readonly badgeKey?: string;
  readonly children?: readonly NavLeaf[];
}

const COLLAPSE_KEY = 'ls45admin.sidebar.collapsed';
const MOBILE_QUERY = '(max-width: 860px)';

/** Friendly labels for URL segments used in the breadcrumb + page title. */
const SEGMENT_LABELS: Record<string, string> = {
  packages: 'Packages', products: 'Products', orders: 'Orders', returns: 'Returns',
  shipping: 'Shipping', inventory: 'Inventory', reviews: 'Reviews', collections: 'Collections', coupons: 'Coupons',
  bookings: 'Bookings', reports: 'Reports', taxonomy: 'Taxonomy',
  content: 'Content', pages: 'Pages', blog: 'Blog', categories: 'Categories',
  departures: 'Departures', manifest: 'Manifest', new: 'New', edit: 'Edit',
  team: 'Team', users: 'Team', roles: 'Roles', customers: 'Customers', 'module-access': 'Module Access',
  settings: 'Settings',
};

/** Top-level routes that actually exist — only these breadcrumb segments are clickable. */
const NAVIGABLE_ROUTES = new Set([
  '/packages', '/products', '/collections', '/reviews', '/orders', '/returns', '/shipping', '/inventory',
  '/coupons', '/bookings', '/reports', '/taxonomy', '/content/pages', '/content/blog',
  '/team/users', '/team/roles', '/team/module-access', '/customers', '/settings',
]);

/** Inline icon path data (24x24) keyed by name — avoids an icon-font dependency. */
const ICONS: Record<string, string> = {
  dashboard: 'M3 3h8v8H3zm10 0h8v5h-8zm0 7h8v11h-8zM3 13h8v8H3z',
  packages: 'M12 2l9 5v10l-9 5-9-5V7zm0 2.3L5 8v8l7 3.9L19 16V8z',
  taxonomy: 'M10 2l10 10-8 8L2 10V2zm-3 3.5A1.5 1.5 0 105.5 7 1.5 1.5 0 007 5.5z',
  bookings: 'M7 2v2h10V2h2v2h3v18H2V4h3V2zm13 8H4v10h16zM6 12h5v4H6z',
  orders: 'M7 4V2h10v2h3l-1 16H5L4 4zm2 0h6V4H9zm-2 4 1 10h8l1-10z',
  pages: 'M6 2h9l5 5v15H6zm8 1.5V8h4.5zM8 12h8v2H8zm0 4h8v2H8z',
  blog: 'M3 17.2V21h3.8L18 9.8 14.2 6zM20.7 7a1 1 0 000-1.4L18.4 3.3a1 1 0 00-1.4 0l-1.8 1.8L19 8.8z',
  reports: 'M4 13h4v8H4zm6-6h4v14h-4zm6 3h4v11h-4z',
  team: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-8 9a8 8 0 0116 0z',
  roles: 'M12 1l9 4v6c0 5-3.8 9.7-9 11-5.2-1.3-9-6-9-11V5zm0 2.2L5 6.3V11c0 3.8 2.8 7.5 7 8.7 4.2-1.2 7-4.9 7-8.7V6.3z',
  customers: 'M16 11a3 3 0 100-6 3 3 0 000 6zm-8 0a3 3 0 100-6 3 3 0 000 6zm0 2c-2.7 0-8 1.3-8 4v3h10v-3c0-1 .4-1.8 1-2.5C5 13.2 8 13 8 13zm8 0c-.3 0-.7 0-1.1.1 1.3 1 1.1 2 1.1 2.9v3h8v-3c0-2.7-5.3-4-8-4z',
  access: 'M12 1l9 4v6c0 5-3.8 9.7-9 11-5.2-1.3-9-6-9-11V5zm-1 9H7l5-5v3h4l-5 5z',
  settings: 'M12 8a4 4 0 100 8 4 4 0 000-8zm9 4a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2L16 3H8l-.5 2.4a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 003 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2L8 21h8l.5-2.4c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
};

/**
 * Admin shell: grouped, collapsible sidebar with a viewport-aware hamburger.
 * - Desktop: the hamburger collapses the sidebar to an icon rail (state persisted).
 * - Mobile (≤860px): the hamburger opens the sidebar as an off-canvas drawer with a backdrop.
 * Nav is grouped into sections (Overview / Catalogue / Operations / Content / Insights), each
 * mapped to a real admin route.
 */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ToastContainerComponent,
    ConfirmDialogComponent,
    QuickFindComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly reports = inject(ReportService);
  protected readonly quickFind = inject(QuickFindService);
  protected readonly theme = inject(ThemeService);

  readonly user = this.auth.user;
  /** Configured site branding (logo / name) for the sidebar mark. */
  readonly branding = inject(BrandingService).branding;

  readonly collapsed = signal(this.readCollapsed());
  readonly mobileOpen = signal(false);

  /** Live counts surfaced as nav badges (best-effort; silently empty if the report fails). */
  readonly badges = signal<Record<string, number>>({});

  readonly crumbs = signal<Crumb[]>([{ label: 'Dashboard', url: '/', link: false }]);
  readonly pageTitle = computed(() => this.crumbs().at(-1)?.label ?? 'Dashboard');

  readonly userMenuOpen = signal(false);
  readonly initials = computed(() => {
    const u = this.user();
    return u ? `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() : '';
  });

  constructor() {
    this.reports.getBookingStats().subscribe({
      next: (s) => this.badges.set({ bookings: s.pendingBookings }),
      error: () => {
        /* badge is optional — leave it empty */
      },
    });

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.buildCrumbs());
    this.buildCrumbs();
  }

  /** Derive a Dashboard → … → current breadcrumb trail from the active URL. */
  private buildCrumbs(): void {
    const path = this.router.url.split(/[?#]/)[0];
    const segments = path.split('/').filter(Boolean);
    const crumbs: Crumb[] = [{ label: 'Dashboard', url: '/', link: segments.length > 0 }];
    let acc = '';
    for (const seg of segments) {
      acc += `/${seg}`;
      const isId = /^\d+$/.test(seg) || seg.length > 24 || /[0-9a-f]{8}-[0-9a-f]{4}/.test(seg);
      if (isId) {
        continue;
      }
      crumbs.push({
        label: SEGMENT_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
        url: acc,
        link: NAVIGABLE_ROUTES.has(acc),
      });
    }
    this.crumbs.set(crumbs);
  }

  /** Parent → child nav tree. Top-level nodes are direct links or expandable parents. */
  private readonly navTree: readonly NavNode[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/', exact: true },
    {
      label: 'Catalogue', icon: 'packages', children: [
        { label: 'Packages', route: '/packages', perm: 'package:read:all' },
        { label: 'Products', route: '/products', adminOnly: true },
        { label: 'Collections', route: '/collections', adminOnly: true },
        { label: 'Reviews', route: '/reviews', adminOnly: true },
        { label: 'Taxonomy', route: '/taxonomy', perm: 'package:read:all' },
      ],
    },
    { label: 'Bookings', icon: 'bookings', route: '/bookings', badgeKey: 'bookings', perm: 'booking:read:all' },
    {
      label: 'Shop orders', icon: 'orders', children: [
        { label: 'Orders', route: '/orders', adminOnly: true },
        { label: 'Returns', route: '/returns', adminOnly: true },
        { label: 'Shipping', route: '/shipping', adminOnly: true },
        { label: 'Inventory', route: '/inventory', adminOnly: true },
        { label: 'Coupons', route: '/coupons', adminOnly: true },
      ],
    },
    {
      label: 'Content', icon: 'pages', children: [
        { label: 'Pages', route: '/content/pages', perm: 'content:read:all' },
        { label: 'Blog', route: '/content/blog', perm: 'content:read:all' },
      ],
    },
    { label: 'Reports', icon: 'reports', route: '/reports', perm: 'report:read:all' },
    {
      label: 'Team & Access', icon: 'team', children: [
        { label: 'Customers', route: '/customers', perm: 'user:read:all' },
        { label: 'Team', route: '/team/users', adminOnly: true },
        { label: 'Roles', route: '/team/roles', adminOnly: true },
        { label: 'Module Access', route: '/team/module-access', superOnly: true },
        { label: 'Settings', route: '/settings', adminOnly: true },
      ],
    },
  ];

  /** Which parent menus are expanded (all open by default). */
  readonly expanded = signal<Set<string>>(new Set(['Catalogue', 'Content', 'Team & Access']));

  /** Nav filtered to what the signed-in user may see; parents drop when no child is visible. */
  readonly visibleNav = computed<NavNode[]>(() =>
    this.navTree
      .map((node) => {
        if (node.children) {
          const children = node.children.filter((c) => this.canShow(c));
          return children.length ? { ...node, children } : null;
        }
        return this.canShow(node) ? node : null;
      })
      .filter((n): n is NavNode => n !== null),
  );

  isExpanded(label: string): boolean {
    return this.expanded().has(label);
  }

  toggleNode(label: string): void {
    this.expanded.update((s) => {
      const next = new Set(s);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  private canShow(it: NavGate): boolean {
    if (it.superOnly) {
      return this.auth.isSuperAdmin();
    }
    if (it.adminOnly) {
      return this.auth.isAdmin();
    }
    return this.auth.canAccess(it.perm);
  }

  iconPath(key: string): string {
    return ICONS[key] ?? '';
  }

  badgeCount(item: { readonly badgeKey?: string }): number {
    return item.badgeKey ? this.badges()[item.badgeKey] ?? 0 : 0;
  }

  /** Hamburger: collapse the rail on desktop, toggle the drawer on mobile. */
  onMenuToggle(): void {
    if (window.matchMedia(MOBILE_QUERY).matches) {
      this.mobileOpen.update((open) => !open);
    } else {
      this.toggleCollapse();
    }
  }

  toggleCollapse(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
    } catch {
      /* storage unavailable — collapse simply won't persist */
    }
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  logout(): void {
    this.userMenuOpen.set(false);
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  private readCollapsed(): boolean {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  }
}
