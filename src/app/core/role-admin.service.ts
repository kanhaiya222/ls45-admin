import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import { ApiResponse, CreateRolePayload, Permission, Role } from './models';

/**
 * Admin role & permission management — list/create/update/delete custom roles and read the
 * permission catalogue used to build a role's permission matrix. System roles are immutable
 * (the backend rejects edit/delete; the UI also locks them).
 */
@Injectable({ providedIn: 'root' })
export class RoleAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/admin/roles`;

  listRoles(): Observable<Role[]> {
    return this.http
      .get<ApiResponse<Role[]>>(this.base)
      .pipe(map((res) => res.data));
  }

  getRole(publicId: string): Observable<Role> {
    return this.http
      .get<ApiResponse<Role>>(`${this.base}/${publicId}`)
      .pipe(map((res) => res.data));
  }

  createRole(payload: CreateRolePayload): Observable<Role> {
    return this.http
      .post<ApiResponse<Role>>(this.base, payload)
      .pipe(map((res) => res.data));
  }

  updateRole(publicId: string, payload: CreateRolePayload): Observable<Role> {
    return this.http
      .put<ApiResponse<Role>>(`${this.base}/${publicId}`, payload)
      .pipe(map((res) => res.data));
  }

  deleteRole(publicId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.base}/${publicId}`)
      .pipe(map(() => undefined));
  }

  /** Full permission catalogue (RESOURCE:ACTION:SCOPE), used to render the role permission matrix. */
  listPermissions(): Observable<Permission[]> {
    return this.http
      .get<ApiResponse<Permission[]>>(`${API_BASE_URL}/admin/permissions`)
      .pipe(map((res) => res.data));
  }

  /** Grant permission codes to a role (additive). Works on system roles too (unlike role edit). */
  assignPermissions(rolePublicId: string, codes: readonly string[]): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/${rolePublicId}/permissions`, codes)
      .pipe(map(() => undefined));
  }

  /** Revoke a single permission code from a role. */
  removePermission(rolePublicId: string, code: string): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.base}/${rolePublicId}/permissions/${encodeURIComponent(code)}`)
      .pipe(map(() => undefined));
  }
}
