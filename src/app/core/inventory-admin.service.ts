import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import { ApiResponse, VariantStock } from './models';

/**
 * Admin inventory — simple single-source stock: set or adjust a variant's on-hand quantity.
 * No warehouses or stock levels; status (in/low/out) is derived from the quantity by the backend.
 */
@Injectable({ providedIn: 'root' })
export class InventoryAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/admin/inventory/variants`;

  /** Sets a variant's absolute on-hand quantity. */
  setQuantity(variantPublicId: string, quantity: number): Observable<VariantStock> {
    return this.http
      .put<ApiResponse<VariantStock>>(`${this.base}/${variantPublicId}/quantity`, { quantity })
      .pipe(map((r) => r.data));
  }

  /** Applies a relative change (positive to restock, negative to deduct). */
  adjustQuantity(variantPublicId: string, delta: number): Observable<VariantStock> {
    return this.http
      .post<ApiResponse<VariantStock>>(`${this.base}/${variantPublicId}/adjust`, { delta })
      .pipe(map((r) => r.data));
  }
}
