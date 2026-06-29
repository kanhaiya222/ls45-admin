import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import {
  AdminCollectionDetail,
  AdminCollectionListItem,
  ApiResponse,
  CreateCollectionPayload,
} from './models';

/** Admin product-collection management — CRUD, publish/archive lifecycle, and product membership. */
@Injectable({ providedIn: 'root' })
export class CollectionAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/admin/product-collections`;

  list(): Observable<AdminCollectionListItem[]> {
    return this.http
      .get<ApiResponse<{ content: AdminCollectionListItem[] }>>(this.base)
      .pipe(map((res) => res.data.content));
  }

  get(publicId: string): Observable<AdminCollectionDetail> {
    return this.http
      .get<ApiResponse<AdminCollectionDetail>>(`${this.base}/${publicId}`)
      .pipe(map((res) => res.data));
  }

  create(payload: CreateCollectionPayload): Observable<AdminCollectionDetail> {
    return this.http
      .post<ApiResponse<AdminCollectionDetail>>(this.base, payload)
      .pipe(map((res) => res.data));
  }

  update(publicId: string, payload: CreateCollectionPayload): Observable<AdminCollectionDetail> {
    return this.http
      .put<ApiResponse<AdminCollectionDetail>>(`${this.base}/${publicId}`, payload)
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

  addProduct(publicId: string, productPublicId: string, sortOrder = 0): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/${publicId}/products`, {
      productPublicId,
      sortOrder,
    });
  }

  removeProduct(publicId: string, productPublicId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.base}/${publicId}/products/${productPublicId}`)
      .pipe(map(() => undefined));
  }
}
