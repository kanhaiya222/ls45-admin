import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import {
  AdminOrder,
  AdminOrderListItem,
  ApiResponse,
  CreateShipmentPayload,
  FulfillmentLocation,
  PageResponse,
  ReturnRequest,
  Shipment,
  UpdateShipmentStatusPayload,
} from './models';

/**
 * Admin Shop operations — orders, fulfillment (shipments + tracking) and returns/refunds. Wraps
 * /admin/orders, /admin/fulfillment and /admin/returns. Order status advances through the
 * fulfillment flow (creating + dispatching shipments); refunds flow through the returns lifecycle.
 */
@Injectable({ providedIn: 'root' })
export class OrderAdminService {
  private readonly http = inject(HttpClient);
  private readonly orders = `${API_BASE_URL}/admin/orders`;
  private readonly fulfillment = `${API_BASE_URL}/admin/fulfillment`;
  private readonly returns = `${API_BASE_URL}/admin/returns`;

  // ── orders ──
  list(status: string | null, page = 0, size = 20): Observable<PageResponse<AdminOrderListItem>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) {
      params = params.set('status', status);
    }
    return this.http
      .get<ApiResponse<PageResponse<AdminOrderListItem>>>(this.orders, { params })
      .pipe(map((res) => res.data));
  }

  get(publicId: string): Observable<AdminOrder> {
    return this.http
      .get<ApiResponse<AdminOrder>>(`${this.orders}/${publicId}`)
      .pipe(map((res) => res.data));
  }

  // ── fulfillment ──
  listLocations(): Observable<FulfillmentLocation[]> {
    return this.http
      .get<ApiResponse<FulfillmentLocation[]>>(`${this.fulfillment}/locations`)
      .pipe(map((res) => res.data));
  }

  createShipment(orderPublicId: string, payload: CreateShipmentPayload): Observable<Shipment> {
    return this.http
      .post<ApiResponse<Shipment>>(`${this.fulfillment}/orders/${orderPublicId}/shipments`, payload)
      .pipe(map((res) => res.data));
  }

  getShipment(publicId: string): Observable<Shipment> {
    return this.http
      .get<ApiResponse<Shipment>>(`${this.fulfillment}/shipments/${publicId}`)
      .pipe(map((res) => res.data));
  }

  listOrderShipments(orderPublicId: string): Observable<Shipment[]> {
    return this.http
      .get<ApiResponse<Shipment[]>>(`${this.fulfillment}/orders/${orderPublicId}/shipments`)
      .pipe(map((res) => res.data));
  }

  updateShipmentStatus(publicId: string, payload: UpdateShipmentStatusPayload): Observable<Shipment> {
    return this.http
      .patch<ApiResponse<Shipment>>(`${this.fulfillment}/shipments/${publicId}/status`, payload)
      .pipe(map((res) => res.data));
  }

  // ── returns ──
  listReturns(status: string | null, page = 0, size = 20): Observable<PageResponse<ReturnRequest>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) {
      params = params.set('status', status);
    }
    return this.http
      .get<ApiResponse<PageResponse<ReturnRequest>>>(this.returns, { params })
      .pipe(map((res) => res.data));
  }

  getReturn(publicId: string): Observable<ReturnRequest> {
    return this.http
      .get<ApiResponse<ReturnRequest>>(`${this.returns}/${publicId}`)
      .pipe(map((res) => res.data));
  }

  returnAction(
    publicId: string,
    action: 'approve' | 'reject' | 'receive' | 'refund',
  ): Observable<ReturnRequest> {
    return this.http
      .post<ApiResponse<ReturnRequest>>(`${this.returns}/${publicId}/${action}`, {})
      .pipe(map((res) => res.data));
  }
}
