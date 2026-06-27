import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import { ApiResponse, Branding } from './models';

/** Admin site settings — read/update the tenant's branding + config (TENANT_ADMIN). */
@Injectable({ providedIn: 'root' })
export class SettingsAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/admin/settings`;

  get(): Observable<Branding> {
    return this.http.get<ApiResponse<Branding>>(this.base).pipe(map((r) => r.data));
  }

  update(payload: Branding): Observable<Branding> {
    return this.http.put<ApiResponse<Branding>>(this.base, payload).pipe(map((r) => r.data));
  }
}
