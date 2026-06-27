import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ReportService } from '../../core/report.service';
import { BookingStats, PackagePerformance, RevenueReport } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {
  private readonly reports = inject(ReportService);

  readonly loading = signal(true);
  readonly errored = signal(false);
  readonly stats = signal<BookingStats | null>(null);
  readonly revenue = signal<RevenueReport | null>(null);
  readonly topPackages = signal<PackagePerformance[]>([]);

  constructor() {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const iso = (d: Date) => d.toISOString().slice(0, 10);

    // Load headline stats, 30-day revenue and top journeys together; each degrades
    // independently so one failing report never blanks the whole dashboard.
    forkJoin({
      stats: this.reports.getBookingStats().pipe(catchError(() => of<BookingStats | null>(null))),
      revenue: this.reports
        .getRevenue(iso(from), iso(to))
        .pipe(catchError(() => of<RevenueReport | null>(null))),
      top: this.reports
        .getPackagePerformance(iso(from), iso(to))
        .pipe(catchError(() => of<PackagePerformance[]>([]))),
    }).subscribe({
      next: ({ stats, revenue, top }) => {
        this.stats.set(stats);
        this.revenue.set(revenue);
        this.topPackages.set(
          [...top].sort((a, b) => b.confirmedRevenue - a.confirmedRevenue).slice(0, 5),
        );
        this.errored.set(stats === null);
        this.loading.set(false);
      },
      error: () => {
        this.errored.set(true);
        this.loading.set(false);
      },
    });
  }
}
