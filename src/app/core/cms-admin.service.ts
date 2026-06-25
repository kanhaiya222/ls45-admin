import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import {
  ApiResponse,
  CmsPageDetail,
  CmsPageListItem,
  CreateCmsPagePayload,
  PageResponse,
} from './models';

/** Admin CMS page management — list/get/create/update + publish/archive/delete. */
@Injectable({ providedIn: 'root' })
export class CmsAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/admin/cms/pages`;

  list(status: string | null, page = 0, size = 20): Observable<PageResponse<CmsPageListItem>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) {
      params = params.set('status', status);
    }
    return this.http
      .get<ApiResponse<PageResponse<CmsPageListItem>>>(this.base, { params })
      .pipe(map((res) => res.data));
  }

  get(publicId: string): Observable<CmsPageDetail> {
    return this.http
      .get<ApiResponse<CmsPageDetail>>(`${this.base}/${publicId}`)
      .pipe(map((res) => res.data));
  }

  create(payload: CreateCmsPagePayload): Observable<CmsPageDetail> {
    return this.http
      .post<ApiResponse<CmsPageDetail>>(this.base, payload)
      .pipe(map((res) => res.data));
  }

  update(publicId: string, payload: CreateCmsPagePayload): Observable<CmsPageDetail> {
    return this.http
      .put<ApiResponse<CmsPageDetail>>(`${this.base}/${publicId}`, payload)
      .pipe(map((res) => res.data));
  }

  publish(publicId: string): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/${publicId}/publish`, {})
      .pipe(map(() => undefined));
  }

  archive(publicId: string): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/${publicId}/archive`, {})
      .pipe(map(() => undefined));
  }

  delete(publicId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.base}/${publicId}`)
      .pipe(map(() => undefined));
  }
}
