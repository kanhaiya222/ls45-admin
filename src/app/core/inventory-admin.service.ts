import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import {
  AdjustStockPayload,
  ApiResponse,
  CreateWarehousePayload,
  PageResponse,
  StockLevel,
  StockMovement,
  Warehouse,
} from './models';

/** Admin inventory — warehouses (stock locations) + per-variant stock levels, adjustments, movements. */
@Injectable({ providedIn: 'root' })
export class InventoryAdminService {
  private readonly http = inject(HttpClient);
  private readonly warehouses = `${API_BASE_URL}/admin/warehouses`;
  private readonly stock = `${API_BASE_URL}/admin/stock`;

  // ── warehouses ──
  listWarehouses(): Observable<Warehouse[]> {
    return this.http.get<ApiResponse<Warehouse[]>>(this.warehouses).pipe(map((r) => r.data));
  }
  createWarehouse(payload: CreateWarehousePayload): Observable<Warehouse> {
    return this.http.post<ApiResponse<Warehouse>>(this.warehouses, payload).pipe(map((r) => r.data));
  }
  updateWarehouse(publicId: string, payload: CreateWarehousePayload): Observable<Warehouse> {
    return this.http
      .put<ApiResponse<Warehouse>>(`${this.warehouses}/${publicId}`, payload)
      .pipe(map((r) => r.data));
  }
  setWarehouseActive(publicId: string, active: boolean): Observable<Warehouse> {
    const action = active ? 'activate' : 'deactivate';
    return this.http
      .post<ApiResponse<Warehouse>>(`${this.warehouses}/${publicId}/${action}`, {})
      .pipe(map((r) => r.data));
  }
  deleteWarehouse(publicId: string): Observable<void> {
    return this.http.delete<ApiResponse<unknown>>(`${this.warehouses}/${publicId}`).pipe(map(() => undefined));
  }

  // ── stock ──
  stockForVariant(variantPublicId: string): Observable<StockLevel[]> {
    return this.http
      .get<ApiResponse<StockLevel[]>>(`${this.stock}/variants/${variantPublicId}`)
      .pipe(map((r) => r.data));
  }
  adjust(payload: AdjustStockPayload): Observable<StockLevel> {
    return this.http.post<ApiResponse<StockLevel>>(`${this.stock}/adjust`, payload).pipe(map((r) => r.data));
  }
  movements(variantPublicId: string, page = 0, size = 20): Observable<PageResponse<StockMovement>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<StockMovement>>>(`${this.stock}/variants/${variantPublicId}/movements`, {
        params,
      })
      .pipe(map((r) => r.data));
  }
}
