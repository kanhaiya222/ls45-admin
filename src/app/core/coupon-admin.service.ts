import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './config';
import {
  AdminCoupon,
  ApiResponse,
  CouponCampaign,
  CreateCampaignPayload,
  CreateCouponPayload,
} from './models';

/** Admin coupon management — campaigns and their coupons (create + activate/deactivate). */
@Injectable({ providedIn: 'root' })
export class CouponAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/admin/coupon-campaigns`;

  listCampaigns(): Observable<CouponCampaign[]> {
    return this.http.get<ApiResponse<CouponCampaign[]>>(this.base).pipe(map((r) => r.data));
  }

  createCampaign(payload: CreateCampaignPayload): Observable<CouponCampaign> {
    return this.http.post<ApiResponse<CouponCampaign>>(this.base, payload).pipe(map((r) => r.data));
  }

  listCoupons(campaignPublicId: string): Observable<AdminCoupon[]> {
    return this.http
      .get<ApiResponse<AdminCoupon[]>>(`${this.base}/${campaignPublicId}/coupons`)
      .pipe(map((r) => r.data));
  }

  createCoupon(campaignPublicId: string, payload: CreateCouponPayload): Observable<AdminCoupon> {
    return this.http
      .post<ApiResponse<AdminCoupon>>(`${this.base}/${campaignPublicId}/coupons`, payload)
      .pipe(map((r) => r.data));
  }

  setCouponStatus(
    campaignPublicId: string,
    couponPublicId: string,
    status: string,
  ): Observable<AdminCoupon> {
    return this.http
      .patch<ApiResponse<AdminCoupon>>(
        `${this.base}/${campaignPublicId}/coupons/${couponPublicId}/status`,
        { status },
      )
      .pipe(map((r) => r.data));
  }
}
