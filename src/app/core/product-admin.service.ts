import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import {
  AddProductVariantPayload,
  ApiResponse,
  CreateProductPayload,
  PageResponse,
  ProductDetail,
  ProductListItem,
  ProductVariant,
} from './models';

/**
 * Admin commerce-product management — list across all statuses, CRUD, the publish/archive
 * lifecycle, and per-product variant management. Powers the "Shop" catalogue the storefront reads.
 */
@Injectable({ providedIn: 'root' })
export class ProductAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/admin/products`;

  list(status: string | null, page = 0, size = 20): Observable<PageResponse<ProductListItem>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) {
      params = params.set('status', status);
    }
    return this.http
      .get<ApiResponse<PageResponse<ProductListItem>>>(this.base, { params })
      .pipe(map((res) => res.data));
  }

  get(publicId: string): Observable<ProductDetail> {
    return this.http
      .get<ApiResponse<ProductDetail>>(`${this.base}/${publicId}`)
      .pipe(map((res) => res.data));
  }

  create(payload: CreateProductPayload): Observable<ProductDetail> {
    return this.http
      .post<ApiResponse<ProductDetail>>(this.base, payload)
      .pipe(map((res) => res.data));
  }

  update(publicId: string, payload: CreateProductPayload): Observable<ProductDetail> {
    return this.http
      .put<ApiResponse<ProductDetail>>(`${this.base}/${publicId}`, payload)
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

  addVariant(publicId: string, payload: AddProductVariantPayload): Observable<ProductVariant> {
    return this.http
      .post<ApiResponse<ProductVariant>>(`${this.base}/${publicId}/variants`, payload)
      .pipe(map((res) => res.data));
  }

  deleteVariant(publicId: string, variantPublicId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.base}/${publicId}/variants/${variantPublicId}`)
      .pipe(map(() => undefined));
  }
}
