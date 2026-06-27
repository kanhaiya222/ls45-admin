import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BrandPricePipe } from '../../core/brand-price.pipe';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { ReportService } from '../../core/report.service';
import { PackageAdminService } from '../../core/package-admin.service';
import { DepartureAdminService } from '../../core/departure-admin.service';
import { BookingStats, DepartureSummary, PackagePerformance, RevenueReport } from '../../core/models';

interface FillCard {
  readonly publicId: string;
  readonly packageName: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly booked: number;
  readonly capacity: number;
  readonly seatsLeft: number;
  readonly fill: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [BrandPricePipe, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {
  private readonly reports = inject(ReportService);
  private readonly packagesApi = inject(PackageAdminService);
  private readonly departuresApi = inject(DepartureAdminService);

  readonly loading = signal(true);
  readonly errored = signal(false);
  readonly stats = signal<BookingStats | null>(null);
  readonly revenue = signal<RevenueReport | null>(null);
  readonly topPackages = signal<PackagePerformance[]>([]);
  readonly departures = signal<FillCard[]>([]);

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

    this.loadDepartures();
  }

  /** Fan out over published packages to surface the fullest upcoming departures. */
  private loadDepartures(): void {
    this.packagesApi
      .list('PUBLISHED', 0, 50)
      .pipe(
        switchMap((page) => {
          const pkgs = page.content ?? [];
          if (!pkgs.length) {
            return of<FillCard[]>([]);
          }
          return forkJoin(
            pkgs.map((p) =>
              this.departuresApi.listForPackage(p.publicId).pipe(
                map((deps) => deps.map((d) => ({ d, name: p.name }))),
                catchError(() => of<{ d: DepartureSummary; name: string }[]>([])),
              ),
            ),
          ).pipe(map((groups) => this.toFillCards(groups.flat())));
        }),
        catchError(() => of<FillCard[]>([])),
      )
      .subscribe((cards) => this.departures.set(cards));
  }

  private toFillCards(rows: { d: DepartureSummary; name: string }[]): FillCard[] {
    const today = new Date().toISOString().slice(0, 10);
    return rows
      .filter(({ d }) => d.startDate >= today && (d.status as string) !== 'CANCELLED' && d.totalCapacity > 0)
      .map(({ d, name }) => {
        const booked = Math.max(0, d.totalCapacity - d.availableSeats);
        return {
          publicId: d.publicId,
          packageName: name,
          startDate: d.startDate,
          endDate: d.endDate,
          booked,
          capacity: d.totalCapacity,
          seatsLeft: d.availableSeats,
          fill: Math.round((booked / d.totalCapacity) * 100),
        };
      })
      .sort((a, b) => b.fill - a.fill)
      .slice(0, 4);
  }
}
