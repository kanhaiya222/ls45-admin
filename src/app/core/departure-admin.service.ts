import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import {
  ApiResponse,
  CreateDeparturePayload,
  DepartureSummary,
  ManifestPassenger,
  WaitlistEntry,
} from './models';

/** Admin departure management — list per package + create + close/reopen/cancel. */
@Injectable({ providedIn: 'root' })
export class DepartureAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/admin/departures`;

  listForPackage(packagePublicId: string): Observable<DepartureSummary[]> {
    const params = new HttpParams().set('packagePublicId', packagePublicId);
    return this.http
      .get<ApiResponse<DepartureSummary[]>>(this.base, { params })
      .pipe(map((res) => res.data));
  }

  create(payload: CreateDeparturePayload): Observable<DepartureSummary> {
    return this.http
      .post<ApiResponse<DepartureSummary>>(this.base, payload)
      .pipe(map((res) => res.data));
  }

  close(publicId: string): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/${publicId}/close`, {})
      .pipe(map(() => undefined));
  }

  reopen(publicId: string): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/${publicId}/reopen`, {})
      .pipe(map(() => undefined));
  }

  cancel(publicId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.base}/${publicId}`)
      .pipe(map(() => undefined));
  }

  getManifest(departurePublicId: string): Observable<ManifestPassenger[]> {
    return this.http
      .get<ApiResponse<ManifestPassenger[]>>(`${this.base}/${departurePublicId}/manifest`)
      .pipe(map((res) => res.data));
  }

  getWaitlist(departurePublicId: string): Observable<WaitlistEntry[]> {
    return this.http
      .get<ApiResponse<WaitlistEntry[]>>(`${this.base}/${departurePublicId}/waitlist`)
      .pipe(map((res) => res.data));
  }

  notifyWaitlist(departurePublicId: string): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/${departurePublicId}/waitlist/notify`, {})
      .pipe(map(() => undefined));
  }
}
