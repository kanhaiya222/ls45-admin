import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import { AdminUser, ApiResponse, CreateStaffUserPayload, PageResponse } from './models';

/** Audience filter for the admin user list — keeps the internal team and customers on separate screens. */
export type UserAudience = 'STAFF' | 'CUSTOMER';

/**
 * Admin user operations — list staff/customers, invite a staff member, change status, and attach or
 * detach roles. Backs the "Team" and "Customers" screens (GET /api/v1/admin/users is shared; the
 * `audience` param narrows it server-side).
 */
@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/admin/users`;

  list(
    opts: { page?: number; size?: number; search?: string; audience?: UserAudience } = {},
  ): Observable<PageResponse<AdminUser>> {
    let params = new HttpParams()
      .set('page', opts.page ?? 0)
      .set('size', opts.size ?? 20);
    if (opts.search?.trim()) {
      params = params.set('search', opts.search.trim());
    }
    if (opts.audience) {
      params = params.set('audience', opts.audience);
    }
    return this.http
      .get<ApiResponse<PageResponse<AdminUser>>>(this.base, { params })
      .pipe(map((res) => res.data));
  }

  get(publicId: string): Observable<AdminUser> {
    return this.http
      .get<ApiResponse<AdminUser>>(`${this.base}/${publicId}`)
      .pipe(map((res) => res.data));
  }

  createStaff(payload: CreateStaffUserPayload): Observable<AdminUser> {
    return this.http
      .post<ApiResponse<AdminUser>>(this.base, payload)
      .pipe(map((res) => res.data));
  }

  suspend(publicId: string): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/${publicId}/suspend`, {})
      .pipe(map(() => undefined));
  }

  activate(publicId: string): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/${publicId}/activate`, {})
      .pipe(map(() => undefined));
  }

  remove(publicId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.base}/${publicId}`)
      .pipe(map(() => undefined));
  }

  /** Attach a role to a user. The backend keys roles by name (e.g. "MANAGER"). */
  assignRole(publicId: string, roleName: string): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/${publicId}/roles`, { roleCode: roleName })
      .pipe(map(() => undefined));
  }

  removeRole(publicId: string, roleName: string): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.base}/${publicId}/roles/${encodeURIComponent(roleName)}`)
      .pipe(map(() => undefined));
  }
}
