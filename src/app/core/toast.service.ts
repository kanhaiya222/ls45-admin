import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  readonly id: number;
  readonly kind: ToastKind;
  readonly text: string;
}

/** Lightweight, signal-based toast notifications. Auto-dismiss; errors linger a little longer. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly toasts = signal<Toast[]>([]);

  success(text: string): void {
    this.push('success', text);
  }

  error(text: string): void {
    this.push('error', text);
  }

  info(text: string): void {
    this.push('info', text);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: ToastKind, text: string): void {
    const id = ++this.seq;
    this.toasts.update((list) => [...list, { id, kind, text }]);
    setTimeout(() => this.dismiss(id), kind === 'error' ? 6000 : 4000);
  }
}
