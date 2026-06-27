import { Injectable, signal } from '@angular/core';

/** Open/close state for the global quick-find palette (Ctrl/⌘+K). */
@Injectable({ providedIn: 'root' })
export class QuickFindService {
  readonly isOpen = signal(false);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.update((open) => !open);
  }
}
