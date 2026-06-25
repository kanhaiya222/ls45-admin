import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import { ApiResponse, Booking, PageResponse, PaymentRecord } from './models';

/** Admin booking operations — list all bookings + payment drill-down + cancel/refund. */
@Injectable({ providedIn: 'root' })
export class BookingAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/admin/bookings`;

  list(page = 0, size = 20): Observable<PageResponse<Booking>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<Booking>>>(this.base, { params })
      .pipe(map((res) => res.data));
  }

  getPayments(publicId: string): Observable<PaymentRecord[]> {
    return this.http
      .get<ApiResponse<PaymentRecord[]>>(`${this.base}/${publicId}/payments`)
      .pipe(map((res) => res.data));
  }

  cancel(publicId: string, reason: string | undefined): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/${publicId}/cancel`, { reason })
      .pipe(map(() => undefined));
  }
}
