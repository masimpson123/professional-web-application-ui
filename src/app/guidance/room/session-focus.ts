import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FocusDialog } from '../check-in/focus-dialog';
import { focusSummary } from '../check-in/focus-fields';
import { SessionStore } from '../session/session.store';

/**
 * Members: the session's pre-session check-in, what they'd like to focus on, with
 * a way to do or change it. In the room's header, so it's there before and during
 * the session, whatever the format.
 */
@Component({
  selector: 'app-session-focus',
  imports: [FocusDialog],
  template: `
    <span class="label">Pre-session check-in:</span>
    <span class="value">{{ summary() || (store.focus()?.note ? 'Note added' : 'Not done yet') }}</span>
    <button type="button" class="edit" (click)="editing.set(true)">{{ done() ? 'Edit' : 'Do it now' }}</button>

    <app-focus-dialog
      [(open)]="editing"
      [sessionId]="store.session().id"
      [provider]="store.provider().firstName"
      [focus]="store.focus()"
      (saved)="store.focusSaved($event)"
    />
  `,
  styleUrl: './session-focus.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionFocus {
  protected readonly store = inject(SessionStore);

  protected readonly editing = signal(false);
  protected readonly summary = computed(() => focusSummary(this.store.focus()));
  protected readonly done = computed(() => !!this.summary() || !!this.store.focus()?.note);
}
