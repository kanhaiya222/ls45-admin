import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import {
  ApiResponse,
  BlogCategory,
  BlogPostDetail,
  BlogPostListItem,
  CreateBlogCategoryPayload,
  CreateBlogPostPayload,
  PageResponse,
} from './models';

/** Admin blog management — posts (list/get/create/update + publish/archive/delete) + category lookup. */
@Injectable({ providedIn: 'root' })
export class BlogAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/admin/blog`;

  listPosts(status: string | null, page = 0, size = 20): Observable<PageResponse<BlogPostListItem>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) {
      params = params.set('status', status);
    }
    return this.http
      .get<ApiResponse<PageResponse<BlogPostListItem>>>(`${this.base}/posts`, { params })
      .pipe(map((res) => res.data));
  }

  getPost(publicId: string): Observable<BlogPostDetail> {
    return this.http
      .get<ApiResponse<BlogPostDetail>>(`${this.base}/posts/${publicId}`)
      .pipe(map((res) => res.data));
  }

  createPost(payload: CreateBlogPostPayload): Observable<BlogPostDetail> {
    return this.http
      .post<ApiResponse<BlogPostDetail>>(`${this.base}/posts`, payload)
      .pipe(map((res) => res.data));
  }

  updatePost(publicId: string, payload: CreateBlogPostPayload): Observable<BlogPostDetail> {
    return this.http
      .put<ApiResponse<BlogPostDetail>>(`${this.base}/posts/${publicId}`, payload)
      .pipe(map((res) => res.data));
  }

  publishPost(publicId: string): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/posts/${publicId}/publish`, {})
      .pipe(map(() => undefined));
  }

  archivePost(publicId: string): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/posts/${publicId}/archive`, {})
      .pipe(map(() => undefined));
  }

  deletePost(publicId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.base}/posts/${publicId}`)
      .pipe(map(() => undefined));
  }

  listCategories(): Observable<BlogCategory[]> {
    return this.http
      .get<ApiResponse<BlogCategory[]>>(`${this.base}/categories`)
      .pipe(map((res) => res.data));
  }

  createCategory(payload: CreateBlogCategoryPayload): Observable<BlogCategory> {
    return this.http
      .post<ApiResponse<BlogCategory>>(`${this.base}/categories`, payload)
      .pipe(map((res) => res.data));
  }

  deleteCategory(publicId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.base}/categories/${publicId}`)
      .pipe(map(() => undefined));
  }
}
