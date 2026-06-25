import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import {
  ApiResponse,
  BookingStats,
  CustomerActivity,
  CustomerRegistrationReport,
  PackagePerformance,
  PaymentSummary,
  RevenueReport,
} from './models';

/** Reads admin reporting aggregates (tenant scoped server-side from the admin JWT). */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/admin/reports`;

  getBookingStats(): Observable<BookingStats> {
    return this.http
      .get<ApiResponse<BookingStats>>(`${this.base}/bookings/stats`)
      .pipe(map((res) => res.data));
  }

  getRevenue(from: string, to: string): Observable<RevenueReport> {
    return this.http
      .get<ApiResponse<RevenueReport>>(`${this.base}/revenue`, { params: this.range(from, to) })
      .pipe(map((res) => res.data));
  }

  getPaymentSummary(from: string, to: string): Observable<PaymentSummary> {
    return this.http
      .get<ApiResponse<PaymentSummary>>(`${this.base}/payment-summary`, { params: this.range(from, to) })
      .pipe(map((res) => res.data));
  }

  getCustomerRegistrations(from: string, to: string): Observable<CustomerRegistrationReport> {
    return this.http
      .get<ApiResponse<CustomerRegistrationReport>>(
        `${this.base}/customer-registrations`,
        { params: this.range(from, to) },
      )
      .pipe(map((res) => res.data));
  }

  getCustomerActivity(from: string, to: string): Observable<CustomerActivity> {
    return this.http
      .get<ApiResponse<CustomerActivity>>(`${this.base}/customer-activity`, { params: this.range(from, to) })
      .pipe(map((res) => res.data));
  }

  getPackagePerformance(from: string, to: string): Observable<PackagePerformance[]> {
    return this.http
      .get<ApiResponse<PackagePerformance[]>>(
        `${this.base}/package-performance`,
        { params: this.range(from, to) },
      )
      .pipe(map((res) => res.data));
  }

  private range(from: string, to: string): HttpParams {
    return new HttpParams().set('from', from).set('to', to);
  }
}
