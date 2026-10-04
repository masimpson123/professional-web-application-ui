import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DocRow } from '../documents/doc-row';
import { SessionStore } from '../session/session.store';

/**
 * A session that has already happened: what was talked about and what was
 * shared. There's no call to join, so no video.
 */
@Component({
  selector: 'app-past-session-view',
  imports: [DocRow],
  templateUrl: './past-session-view.html',
  styleUrl: './past-session-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PastSessionView {
  protected readonly store = inject(SessionStore);

  protected readonly noRecap = computed(() =>
    this.store.isProvider()
      ? 'You haven’t written a summary for this session yet.'
      : `${this.store.provider().firstName} hasn’t added a summary for this session yet.`,
  );
}
