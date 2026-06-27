import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { API_BASE_URL } from '../config';
import { ApiResponse, AuthResponse, AuthUser, LoginRequest } from '../models';

const ACCESS_KEY = 'ls45admin.accessToken';
const REFRESH_KEY = 'ls45admin.refreshToken';
const USER_KEY = 'ls45admin.user';

/**
 * Admin authentication: login/logout + reactive session state. Pure SPA, so tokens live in
 * localStorage. {@link isAdmin} gates access — only TENANT_ADMIN / SUPER_ADMIN may use the portal.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly currentUser = signal<AuthUser | null>(this.readUser());
  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => {
    const roles = this.currentUser()?.roles ?? [];
    // Accept ROLE_-prefixed or plain authority names.
    return roles.some((r) => r.toUpperCase().includes('ADMIN'));
  });

  /** Top-level admins see every module regardless of fine-grained permissions. */
  readonly isSuperAdmin = computed(() =>
    (this.currentUser()?.roles ?? []).some((r) => r.toUpperCase().includes('SUPER_ADMIN')),
  );
  private readonly isTopAdmin = computed(() =>
    (this.currentUser()?.roles ?? []).some(
      (r) => r.toUpperCase().includes('SUPER_ADMIN') || r.toUpperCase().includes('TENANT_ADMIN'),
    ),
  );
  private readonly perms = computed(() => new Set(this.currentUser()?.permissions ?? []));

  /** True if the signed-in user holds the given permission (RESOURCE:ACTION:SCOPE). */
  hasPermission(code: string): boolean {
    return this.perms().has(code);
  }

  /**
   * Whether the user may see a module/nav item. A null requirement is always visible; top-level
   * admins (SUPER/TENANT) see everything; otherwise the user must hold the required permission.
   */
  canAccess(requiredPermission?: string | null): boolean {
    if (!requiredPermission) {
      return true;
    }
    return this.isTopAdmin() || this.perms().has(requiredPermission);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${API_BASE_URL}/auth/login`, { deviceType: 'WEB', ...request })
      .pipe(
        map((res) => res.data),
        tap((auth) => this.persist(auth)),
      );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http
        .post<ApiResponse<void>>(
          `${API_BASE_URL}/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } },
        )
        .subscribe({ error: () => undefined });
    }
    this.clear();
    this.currentUser.set(null);
  }

  getAccessToken(): string | null {
    return this.read(ACCESS_KEY);
  }

  private getRefreshToken(): string | null {
    return this.read(REFRESH_KEY);
  }

  private persist(auth: AuthResponse): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACCESS_KEY, auth.accessToken);
      localStorage.setItem(REFRESH_KEY, auth.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    }
    this.currentUser.set(auth.user);
  }

  private clear(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  private readUser(): AuthUser | null {
    const raw = this.read(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private read(key: string): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  }
}
