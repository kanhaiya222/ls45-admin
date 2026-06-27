import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  readonly exact?: boolean;
}

interface NavGroup {
  readonly label: string;
  readonly items: readonly NavItem[];
}

const COLLAPSE_KEY = 'ls45admin.sidebar.collapsed';
const MOBILE_QUERY = '(max-width: 860px)';

/** Inline icon path data (24x24) keyed by name — avoids an icon-font dependency. */
const ICONS: Record<string, string> = {
  dashboard: 'M3 3h8v8H3zm10 0h8v5h-8zm0 7h8v11h-8zM3 13h8v8H3z',
  packages: 'M12 2l9 5v10l-9 5-9-5V7zm0 2.3L5 8v8l7 3.9L19 16V8z',
  taxonomy: 'M10 2l10 10-8 8L2 10V2zm-3 3.5A1.5 1.5 0 105.5 7 1.5 1.5 0 007 5.5z',
  bookings: 'M7 2v2h10V2h2v2h3v18H2V4h3V2zm13 8H4v10h16zM6 12h5v4H6z',
  pages: 'M6 2h9l5 5v15H6zm8 1.5V8h4.5zM8 12h8v2H8zm0 4h8v2H8z',
  blog: 'M3 17.2V21h3.8L18 9.8 14.2 6zM20.7 7a1 1 0 000-1.4L18.4 3.3a1 1 0 00-1.4 0l-1.8 1.8L19 8.8z',
  reports: 'M4 13h4v8H4zm6-6h4v14h-4zm6 3h4v11h-4z',
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
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;

  readonly collapsed = signal(this.readCollapsed());
  readonly mobileOpen = signal(false);

  readonly groups: readonly NavGroup[] = [
    { label: 'Overview', items: [{ label: 'Dashboard', route: '/', icon: 'dashboard', exact: true }] },
    {
      label: 'Catalogue',
      items: [
        { label: 'Packages', route: '/packages', icon: 'packages' },
        { label: 'Taxonomy', route: '/taxonomy', icon: 'taxonomy' },
      ],
    },
    { label: 'Operations', items: [{ label: 'Bookings', route: '/bookings', icon: 'bookings' }] },
    {
      label: 'Content',
      items: [
        { label: 'Pages', route: '/content/pages', icon: 'pages' },
        { label: 'Blog', route: '/content/blog', icon: 'blog' },
      ],
    },
    { label: 'Insights', items: [{ label: 'Reports', route: '/reports', icon: 'reports' }] },
  ];

  iconPath(key: string): string {
    return ICONS[key] ?? '';
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

  logout(): void {
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
