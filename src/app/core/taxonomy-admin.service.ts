import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import {
  ApiResponse,
  Category,
  CreateCategoryPayload,
  CreateTagPayload,
  Tag,
} from './models';

/** Admin taxonomy management — categories + tags CRUD. */
@Injectable({ providedIn: 'root' })
export class TaxonomyAdminService {
  private readonly http = inject(HttpClient);

  listCategories(): Observable<Category[]> {
    return this.http
      .get<ApiResponse<Category[]>>(`${API_BASE_URL}/categories`)
      .pipe(map((res) => res.data));
  }

  createCategory(payload: CreateCategoryPayload): Observable<Category> {
    return this.http
      .post<ApiResponse<Category>>(`${API_BASE_URL}/admin/categories`, payload)
      .pipe(map((res) => res.data));
  }

  deleteCategory(publicId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${API_BASE_URL}/admin/categories/${publicId}`)
      .pipe(map(() => undefined));
  }

  listTags(): Observable<Tag[]> {
    return this.http
      .get<ApiResponse<Tag[]>>(`${API_BASE_URL}/admin/tags`)
      .pipe(map((res) => res.data));
  }

  createTag(payload: CreateTagPayload): Observable<Tag> {
    return this.http
      .post<ApiResponse<Tag>>(`${API_BASE_URL}/admin/tags`, payload)
      .pipe(map((res) => res.data));
  }

  deleteTag(publicId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${API_BASE_URL}/admin/tags/${publicId}`)
      .pipe(map(() => undefined));
  }
}
