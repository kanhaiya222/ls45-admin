import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BrandPricePipe } from '../../core/brand-price.pipe';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ReportService } from '../../core/report.service';
import {
  CustomerActivity,
  CustomerRegistrationReport,
  PackagePerformance,
  PaymentSummary,
  RevenueReport,
} from '../../core/models';

@Component({
  selector: 'app-admin-reports',
  imports: [BrandPricePipe, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class ReportsPage {
  private readonly reports = inject(ReportService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly errored = signal(false);

  readonly revenue = signal<RevenueReport | null>(null);
  readonly payments = signal<PaymentSummary | null>(null);
  readonly registrations = signal<CustomerRegistrationReport | null>(null);
  readonly activity = signal<CustomerActivity | null>(null);
  readonly performance = signal<PackagePerformance[]>([]);

  readonly range = this.fb.nonNullable.group({
    from: [this.isoDaysAgo(30)],
    to: [this.isoDaysAgo(0)],
  });

  constructor() {
    this.load();
  }

  apply(): void {
    this.load();
  }

  private load(): void {
    const { from, to } = this.range.getRawValue();
    if (!from || !to) {
      return;
    }
    this.loading.set(true);
    this.errored.set(false);
    forkJoin({
      revenue: this.reports.getRevenue(from, to).pipe(catchError(() => of<RevenueReport | null>(null))),
      payments: this.reports
        .getPaymentSummary(from, to)
        .pipe(catchError(() => of<PaymentSummary | null>(null))),
      registrations: this.reports
        .getCustomerRegistrations(from, to)
        .pipe(catchError(() => of<CustomerRegistrationReport | null>(null))),
      activity: this.reports
        .getCustomerActivity(from, to)
        .pipe(catchError(() => of<CustomerActivity | null>(null))),
      performance: this.reports
        .getPackagePerformance(from, to)
        .pipe(catchError(() => of<PackagePerformance[]>([]))),
    }).subscribe({
      next: (res) => {
        this.revenue.set(res.revenue);
        this.payments.set(res.payments);
        this.registrations.set(res.registrations);
        this.activity.set(res.activity);
        this.performance.set(res.performance);
        this.loading.set(false);
      },
      error: () => {
        this.errored.set(true);
        this.loading.set(false);
      },
    });
  }

  private isoDaysAgo(days: number): string {
    return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  }
}
