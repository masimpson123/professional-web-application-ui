import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ButtonComponent } from '@compsych-ui-components/angular';
import { PageCrumbs } from '../page-crumbs';
import { Viewer } from '../session/viewer';
import { BookSession } from './book-session';
import { SessionRow } from './session-row';
import { SessionFeed, groupByDay, injectNow, listSession } from './session-listing';
import { WhenVisible } from './when-visible';

/**
 * Every session the viewer is booked into, provider or member: what's in
 * progress and coming up, then everything that's already happened. Both lists
 * are paged on the server; past sessions load as you scroll, however many there are.
 */
@Component({
  selector: 'app-sessions-page',
  imports: [BookSession, ButtonComponent, NgTemplateOutlet, SessionRow, WhenVisible],
  templateUrl: './sessions-page.html',
  styleUrl: './sessions-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionsPage {
  protected readonly viewer = inject(Viewer);
  protected readonly now = injectNow();

  protected readonly isMember = computed(() => this.viewer.role() === 'member');
  /** The booking dialog is open. */
  protected readonly booking = signal(false);

  protected readonly upcoming = new SessionFeed('upcoming');
  protected readonly past = new SessionFeed('past');

  /** In progress and future, soonest first. */
  protected readonly upcomingDays = computed(() =>
    groupByDay(this.upcoming.state().items.map((s) => listSession(s, this.now())), this.now()),
  );
  /** Most recent first. */
  protected readonly pastDays = computed(() =>
    groupByDay(this.past.state().items.map((s) => listSession(s, this.now())), this.now()),
  );

  protected readonly summary = computed(() => {
    const upcoming = this.upcoming.state();
    const past = this.past.state();
    return upcoming.loaded && past.loaded ? `${upcoming.total} upcoming, ${past.total} past` : '';
  });

  constructor() {
    inject(PageCrumbs).trail.set([{ id: 'current', label: 'Sessions', kind: 'current' }]);
  }
}
