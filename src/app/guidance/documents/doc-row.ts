import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SessionDoc } from '../api/models';
import { Icon } from '../shared/icon';
import { KIND_ICON, KIND_LABEL } from './doc-kinds';

/**
 * One document in a list: kind icon, title, a line of detail, and an
 * actions slot on the right. Extra lines (e.g. a care plan item's
 * checkbox) are projected into the body via `[slot=body]`.
 *
 * Responsive to its own width, not the window's: in a narrow column (the
 * session room's care plan panel) everything stacks under the title; given
 * room (the home page), the extras sit beside the title on one line, so each
 * row is about half as tall.
 */
@Component({
  selector: 'app-doc-row',
  imports: [Icon],
  template: `
    <div class="row">
      <span class="kind" [attr.data-kind]="doc().kind">
        <app-icon [name]="icon()" [size]="18" [label]="kindLabel()" />
      </span>
      <div class="body">
        <div class="text">
          <p class="title">{{ doc().title }}</p>
          <p class="detail">{{ detail() }}</p>
        </div>
        <ng-content select="[slot=body]" />
      </div>
      <div class="actions"><ng-content /></div>
    </div>
  `,
  styleUrl: './doc-row.scss',
  host: { '[class.is-done]': 'done()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocRow {
  readonly doc = input.required<SessionDoc>();
  /** Overrides the default detail line. */
  readonly detailText = input<string>();
  readonly done = input(false);

  protected readonly icon = computed(() => KIND_ICON[this.doc().kind]);
  protected readonly kindLabel = computed(() => KIND_LABEL[this.doc().kind]);
  protected readonly detail = computed(() => this.detailText() ?? this.doc().detail);
}
