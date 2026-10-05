import { formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { BadgeComponent, ButtonComponent, DialogComponent } from '@compsych-ui-components/angular';
import { DONE_WORDS } from '../documents/doc-kinds';
import { DocRow } from '../documents/doc-row';
import { CarePlanItem, Role } from '../api/models';
import { Icon } from '../shared/icon';

/**
 * A care plan's items, as one list in the order they were added. The member
 * ticks items off; the provider sees where each one stands and can take items
 * out (after confirming, since the member loses them). Used in the session
 * room and on the home page. Items due by the next session don't repeat the
 * date; only later due dates are called out.
 */
@Component({
  selector: 'app-care-plan-list',
  imports: [BadgeComponent, ButtonComponent, DialogComponent, DocRow, Icon],
  templateUrl: './care-plan-list.html',
  styleUrl: './care-plan-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarePlanList {
  readonly items = input.required<CarePlanItem[]>();
  /** Who's looking: members tick items off, providers see their status. */
  readonly role = input.required<Role>();
  /** ISO date of the next session. Items due by then don't repeat the date. */
  readonly nextSession = input<string>();
  /** Whose plan it is, e.g. "Jordan", for the provider's confirmation. */
  readonly memberName = input('the member');

  /** The member ticked an item off, or unticked it. */
  readonly doneChange = output<{ id: string; done: boolean }>();
  /** The provider confirmed taking an item out of the plan. */
  readonly remove = output<CarePlanItem>();

  protected readonly doneWords = DONE_WORDS;

  /** The item the provider asked to remove, waiting on their confirmation. */
  protected readonly removing = signal<CarePlanItem | undefined>(undefined);

  protected detail(item: CarePlanItem): string {
    const next = this.nextSession();
    if (item.done || (next && item.due <= next)) return item.detail;
    return `${item.detail}, due ${formatDate(item.due, 'MMM d', 'en-US')}`;
  }

  /** Saves an uploaded document. The download button is a button, so this does what a download link would. */
  protected download(item: CarePlanItem): void {
    if (!item.url) return;
    const link = document.createElement('a');
    link.href = item.url;
    link.download = item.title;
    link.click();
  }

  protected confirmRemove(): void {
    const item = this.removing();
    this.removing.set(undefined);
    if (item) this.remove.emit(item);
  }
}
