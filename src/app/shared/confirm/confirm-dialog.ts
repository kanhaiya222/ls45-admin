import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfirmService } from '../../core/confirm.service';

/** Single confirm modal driven by ConfirmService.pending(). Mounted once in the shell. */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialogComponent {
  private readonly confirm = inject(ConfirmService);
  readonly pending = this.confirm.pending;

  respond(ok: boolean): void {
    this.confirm.respond(ok);
  }
}
