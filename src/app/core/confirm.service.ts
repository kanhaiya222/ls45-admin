import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  readonly title: string;
  readonly message?: string;
  readonly confirmText?: string;
  readonly cancelText?: string;
  /** Style the confirm action as destructive (coral). */
  readonly danger?: boolean;
}

interface PendingConfirm extends ConfirmRequest {
  readonly resolve: (ok: boolean) => void;
}

/**
 * Promise-based confirmation. A component calls `ask(...)` and awaits the boolean; the
 * ConfirmDialog (mounted once in the shell) renders the prompt and calls `respond(...)`.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly pending = signal<PendingConfirm | null>(null);

  ask(request: ConfirmRequest): Promise<boolean> {
    return new Promise<boolean>((resolve) => this.pending.set({ ...request, resolve }));
  }

  respond(ok: boolean): void {
    const current = this.pending();
    if (current) {
      current.resolve(ok);
      this.pending.set(null);
    }
  }
}
