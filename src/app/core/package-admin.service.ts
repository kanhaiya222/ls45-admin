import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import {
  AddMediaPayload,
  ApiResponse,
  Category,
  CreateFaqPayload,
  CreatePackagePayload,
  Faq,
  PackageDetail,
  PackageListItem,
  PackageMedia,
  PageResponse,
  Tag,
} from './models';

/** Admin package management — list across all statuses + publish/archive lifecycle actions. */
@Injectable({ providedIn: 'root' })
export class PackageAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/admin/packages`;

  list(status: string | null, page = 0, size = 20): Observable<PageResponse<PackageListItem>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) {
      params = params.set('status', status);
    }
    return this.http
      .get<ApiResponse<PageResponse<PackageListItem>>>(this.base, { params })
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

  get(publicId: string): Observable<PackageDetail> {
    return this.http
      .get<ApiResponse<PackageDetail>>(`${this.base}/${publicId}`)
      .pipe(map((res) => res.data));
  }

  create(payload: CreatePackagePayload): Observable<PackageDetail> {
    return this.http
      .post<ApiResponse<PackageDetail>>(this.base, payload)
      .pipe(map((res) => res.data));
  }

  update(publicId: string, payload: CreatePackagePayload): Observable<PackageDetail> {
    return this.http
      .put<ApiResponse<PackageDetail>>(`${this.base}/${publicId}`, payload)
      .pipe(map((res) => res.data));
  }

  listCategories(): Observable<Category[]> {
    return this.http
      .get<ApiResponse<Category[]>>(`${API_BASE_URL}/categories`)
      .pipe(map((res) => res.data));
  }

  listTags(): Observable<Tag[]> {
    return this.http.get<ApiResponse<Tag[]>>(`${API_BASE_URL}/tags`).pipe(map((res) => res.data));
  }

  listFaqs(packagePublicId: string): Observable<Faq[]> {
    return this.http
      .get<ApiResponse<Faq[]>>(`${this.base}/${packagePublicId}/faqs`)
      .pipe(map((res) => res.data));
  }

  addFaq(packagePublicId: string, payload: CreateFaqPayload): Observable<Faq> {
    return this.http
      .post<ApiResponse<Faq>>(`${this.base}/${packagePublicId}/faqs`, payload)
      .pipe(map((res) => res.data));
  }

  deleteFaq(packagePublicId: string, faqPublicId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.base}/${packagePublicId}/faqs/${faqPublicId}`)
      .pipe(map(() => undefined));
  }

  addMedia(packagePublicId: string, payload: AddMediaPayload): Observable<PackageMedia> {
    return this.http
      .post<ApiResponse<PackageMedia>>(`${this.base}/${packagePublicId}/media`, payload)
      .pipe(map((res) => res.data));
  }

  deleteMedia(packagePublicId: string, mediaPublicId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.base}/${packagePublicId}/media/${mediaPublicId}`)
      .pipe(map(() => undefined));
  }
}
