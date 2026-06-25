import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DepartureAdminService } from '../../core/departure-admin.service';
import { ManifestPassenger, WaitlistEntry } from '../../core/models';

@Component({
  selector: 'app-admin-manifest',
  imports: [DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manifest.html',
  styleUrl: './manifest.scss',
})
export class ManifestPage {
  private readonly api = inject(DepartureAdminService);
  private readonly route = inject(ActivatedRoute);

  readonly departurePublicId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly passengers = signal<ManifestPassenger[]>([]);
  readonly waitlist = signal<WaitlistEntry[]>([]);
  readonly loading = signal(true);
  readonly errored = signal(false);
  readonly notifying = signal(false);
  readonly notified = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errored.set(false);
    this.api.getManifest(this.departurePublicId).subscribe({
      next: (list) => {
        this.passengers.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.errored.set(true);
        this.loading.set(false);
      },
    });
    this.api.getWaitlist(this.departurePublicId).subscribe({
      next: (list) => this.waitlist.set(list),
      error: () => this.waitlist.set([]),
    });
  }

  notifyWaitlist(): void {
    if (this.notifying()) {
      return;
    }
    this.notifying.set(true);
    this.api.notifyWaitlist(this.departurePublicId).subscribe({
      next: () => {
        this.notifying.set(false);
        this.notified.set(true);
      },
      error: () => this.notifying.set(false),
    });
  }
}
