import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import { AdminReview, ApiResponse, PageResponse } from './models';

/** Admin product-review moderation — list + approve/reject. Approved reviews show on the storefront. */
@Injectable({ providedIn: 'root' })
export class ReviewAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/admin/reviews`;

  list(status: string | null, page = 0, size = 20): Observable<PageResponse<AdminReview>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) {
      params = params.set('status', status);
    }
    return this.http
      .get<ApiResponse<PageResponse<AdminReview>>>(this.base, { params })
      .pipe(map((res) => res.data));
  }

  approve(publicId: string): Observable<AdminReview> {
    return this.http
      .post<ApiResponse<AdminReview>>(`${this.base}/${publicId}/approve`, {})
      .pipe(map((res) => res.data));
  }

  reject(publicId: string): Observable<AdminReview> {
    return this.http
      .post<ApiResponse<AdminReview>>(`${this.base}/${publicId}/reject`, {})
      .pipe(map((res) => res.data));
  }
}
