import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Shared list-state wrapper for admin list screens. Renders a uniform loading skeleton, error state,
 * and empty state; otherwise projects its content (the list/table). Centralises the four-state
 * boilerplate (and its styles) that was duplicated across every admin list page.
 *
 * Usage:
 *   <app-list-state [loading]="loading()" [error]="errored()" [empty]="items().length === 0"
 *                   errorTitle="Couldn't load X" emptyTitle="No X yet">
 *     <div class="card"><table>…</table></div>
 *   </app-list-state>
 */
@Component({
  selector: 'app-list-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './list-state.html',
  styleUrl: './list-state.scss',
})
export class ListStateComponent {
  readonly loading = input(false);
  readonly error = input(false);
  readonly empty = input(false);

  readonly errorTitle = input('Something went wrong');
  readonly errorText = input('Please ensure the API is running, then refresh.');
  readonly emptyTitle = input('Nothing here yet');
  readonly emptyText = input('No items match the current view.');
  readonly skeletonRows = input(5);

  readonly skeletonArray = computed(() => Array.from({ length: this.skeletonRows() }, (_, i) => i));
}
