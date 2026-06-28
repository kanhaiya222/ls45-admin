import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import {
  ApiResponse,
  CreateShippingMethodPayload,
  CreateShippingRatePayload,
  CreateShippingZonePayload,
  ShippingMethod,
  ShippingRate,
  ShippingZone,
} from './models';

/** Admin shipping configuration — zones, methods and per-zone rates that power /shipping/quote. */
@Injectable({ providedIn: 'root' })
export class ShippingAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/admin/shipping`;

  // ── zones ──
  listZones(): Observable<ShippingZone[]> {
    return this.http.get<ApiResponse<ShippingZone[]>>(`${this.base}/zones`).pipe(map((r) => r.data));
  }
  createZone(payload: CreateShippingZonePayload): Observable<ShippingZone> {
    return this.http.post<ApiResponse<ShippingZone>>(`${this.base}/zones`, payload).pipe(map((r) => r.data));
  }
  updateZone(publicId: string, payload: CreateShippingZonePayload): Observable<ShippingZone> {
    return this.http
      .put<ApiResponse<ShippingZone>>(`${this.base}/zones/${publicId}`, payload)
      .pipe(map((r) => r.data));
  }
  deleteZone(publicId: string): Observable<void> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/zones/${publicId}`).pipe(map(() => undefined));
  }

  // ── methods ──
  listMethods(): Observable<ShippingMethod[]> {
    return this.http.get<ApiResponse<ShippingMethod[]>>(`${this.base}/methods`).pipe(map((r) => r.data));
  }
  createMethod(payload: CreateShippingMethodPayload): Observable<ShippingMethod> {
    return this.http
      .post<ApiResponse<ShippingMethod>>(`${this.base}/methods`, payload)
      .pipe(map((r) => r.data));
  }
  updateMethod(publicId: string, payload: CreateShippingMethodPayload): Observable<ShippingMethod> {
    return this.http
      .put<ApiResponse<ShippingMethod>>(`${this.base}/methods/${publicId}`, payload)
      .pipe(map((r) => r.data));
  }
  deleteMethod(publicId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.base}/methods/${publicId}`)
      .pipe(map(() => undefined));
  }

  // ── rates (per zone) ──
  listRates(zonePublicId: string): Observable<ShippingRate[]> {
    return this.http
      .get<ApiResponse<ShippingRate[]>>(`${this.base}/zones/${zonePublicId}/rates`)
      .pipe(map((r) => r.data));
  }
  createRate(payload: CreateShippingRatePayload): Observable<ShippingRate> {
    return this.http.post<ApiResponse<ShippingRate>>(`${this.base}/rates`, payload).pipe(map((r) => r.data));
  }
  updateRate(publicId: string, payload: CreateShippingRatePayload): Observable<ShippingRate> {
    return this.http
      .put<ApiResponse<ShippingRate>>(`${this.base}/rates/${publicId}`, payload)
      .pipe(map((r) => r.data));
  }
  deleteRate(publicId: string): Observable<void> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/rates/${publicId}`).pipe(map(() => undefined));
  }
}
