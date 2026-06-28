import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import { ApiResponse } from './models';

/** Result of an image upload — the public URL to store + render. */
export interface UploadedImage {
  url: string;
  filename: string;
}

/** Uploads an image to the backend and returns its public serving URL. */
@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  private readonly http = inject(HttpClient);

  upload(file: File): Observable<UploadedImage> {
    const form = new FormData();
    form.append('file', file);
    return this.http
      .post<ApiResponse<UploadedImage>>(`${API_BASE_URL}/admin/images`, form)
      .pipe(map((res) => res.data));
  }
}
