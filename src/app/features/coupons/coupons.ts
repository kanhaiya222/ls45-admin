import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CouponAdminService } from '../../core/coupon-admin.service';
import { ToastService } from '../../core/toast.service';
import { AdminCoupon, CouponCampaign } from '../../core/models';

@Component({
  selector: 'app-admin-coupons',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './coupons.html',
  styleUrl: './coupons.scss',
})
export class CouponsPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CouponAdminService);
  private readonly toast = inject(ToastService);

  readonly campaigns = signal<CouponCampaign[]>([]);
  readonly coupons = signal<AdminCoupon[]>([]);
  readonly selectedCampaignId = signal<string>('');
  readonly busy = signal(false);

  readonly selectedCampaign = computed(() =>
    this.campaigns().find((c) => c.publicId === this.selectedCampaignId()),
  );

  readonly campaignForm = this.fb.nonNullable.group({
    campaignName: ['', Validators.required],
    startsAt: ['', Validators.required],
    endsAt: ['', Validators.required],
    maxTotalUses: [null as number | null],
    maxPerUser: [1, [Validators.required, Validators.min(1)]],
  });

  readonly couponForm = this.fb.nonNullable.group({
    code: ['', Validators.required],
    discountType: ['PERCENT', Validators.required],
    discountValue: [0, [Validators.required, Validators.min(0)]],
    maxDiscountAmount: [null as number | null],
    minOrderAmount: [0],
  });

  constructor() {
    this.loadCampaigns();
  }

  private loadCampaigns(): void {
    this.api.listCampaigns().subscribe({
      next: (list) => {
        this.campaigns.set(list);
        if (list.length && !this.selectedCampaignId()) {
          this.selectCampaign(list[0].publicId);
        }
      },
      error: () => this.campaigns.set([]),
    });
  }

  selectCampaign(id: string): void {
    this.selectedCampaignId.set(id);
    this.api.listCoupons(id).subscribe({
      next: (c) => this.coupons.set(c),
      error: () => this.coupons.set([]),
    });
  }

  addCampaign(): void {
    if (this.campaignForm.invalid || this.busy()) {
      return;
    }
    this.busy.set(true);
    const raw = this.campaignForm.getRawValue();
    this.api
      .createCampaign({
        campaignName: raw.campaignName.trim(),
        // date inputs -> day-bounded ISO instants
        startsAt: new Date(raw.startsAt + 'T00:00:00').toISOString(),
        endsAt: new Date(raw.endsAt + 'T23:59:59').toISOString(),
        maxTotalUses: raw.maxTotalUses != null ? Number(raw.maxTotalUses) : undefined,
        maxPerUser: Number(raw.maxPerUser),
      })
      .subscribe({
        next: () => {
          this.campaignForm.reset({ campaignName: '', startsAt: '', endsAt: '', maxTotalUses: null, maxPerUser: 1 });
          this.busy.set(false);
          this.loadCampaigns();
          this.toast.success('Campaign created');
        },
        error: (e) => this.fail(e),
      });
  }

  addCoupon(): void {
    if (this.couponForm.invalid || !this.selectedCampaignId() || this.busy()) {
      return;
    }
    this.busy.set(true);
    const raw = this.couponForm.getRawValue();
    this.api
      .createCoupon(this.selectedCampaignId(), {
        code: raw.code.trim().toUpperCase(),
        discountType: raw.discountType as 'PERCENT' | 'FIXED',
        discountValue: Number(raw.discountValue),
        maxDiscountAmount: raw.maxDiscountAmount != null ? Number(raw.maxDiscountAmount) : undefined,
        minOrderAmount: Number(raw.minOrderAmount) || 0,
      })
      .subscribe({
        next: () => {
          this.couponForm.reset({ code: '', discountType: 'PERCENT', discountValue: 0, maxDiscountAmount: null, minOrderAmount: 0 });
          this.busy.set(false);
          this.selectCampaign(this.selectedCampaignId());
          this.toast.success('Coupon created');
        },
        error: (e) => this.fail(e),
      });
  }

  toggleCoupon(c: AdminCoupon): void {
    const next = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.api.setCouponStatus(this.selectedCampaignId(), c.publicId, next).subscribe({
      next: (updated) => this.coupons.update((list) => list.map((x) => (x.publicId === updated.publicId ? updated : x))),
      error: () => this.toast.error('Could not update the coupon'),
    });
  }

  private fail(err: unknown): void {
    this.busy.set(false);
    const e = err as { error?: { message?: string } };
    this.toast.error(e?.error?.message ?? 'Operation failed.');
  }
}
