import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReportService } from '../../core/report.service';
import { BookingStats } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {
  private readonly reports = inject(ReportService);

  readonly loading = signal(true);
  readonly errored = signal(false);
  readonly stats = signal<BookingStats | null>(null);

  constructor() {
    this.reports.getBookingStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => {
        this.errored.set(true);
        this.loading.set(false);
      },
    });
  }
}
