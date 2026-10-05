import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@compsych-ui-components/angular';
import { ApiService } from '../api/api.service';
import { BookSession } from '../sessions/book-session';
import { HomeCarePlans } from './home-care-plans';
import { Viewer } from '../session/viewer';
import { HomeSection } from './home-section';
import { Icon } from '../shared/icon';
import { injectNow, listSession } from '../sessions/session-listing';
import { SessionRow } from '../sessions/session-row';
import { GUIDANCE_SESSIONS } from '../paths';

/** How many upcoming sessions the home page lists; the sessions page has the rest. */
const MAX_ON_HOME = 10;

/**
 * The home page's sessions: what's in progress and coming up next, for members
 * and providers alike, with a way to every session past and future.
 */
@Component({
  selector: 'app-your-sessions',
  imports: [BookSession, ButtonComponent, HomeSection, Icon, RouterLink, SessionRow],
  templateUrl: './your-sessions.html',
  styleUrl: './your-sessions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YourSessions {
  private readonly api = inject(ApiService);
  private readonly viewer = inject(Viewer);
  private readonly carePlans = inject(HomeCarePlans);
  protected readonly now = injectNow();
  protected readonly sessionsUrl = GUIDANCE_SESSIONS;
  protected readonly isMember = computed(() => this.viewer.role() === 'member');
  /** The booking dialog is open. */
  protected readonly booking = signal(false);

  /** Just the first page from the server: the next few sessions, not all of them. */
  private readonly sessions = rxResource({
    params: () => (this.viewer.user.hasValue() ? this.viewer.user.value().id : undefined),
    stream: ({ params }) => this.api.getSessions(params, { when: 'upcoming', limit: MAX_ON_HOME }),
  });

  protected readonly view = computed(() => {
    if (this.viewer.user.error() || this.sessions.error()) return 'failed';
    return this.sessions.hasValue() ? 'ready' : 'loading';
  });

  /** In progress and upcoming, soonest first. */
  protected readonly shown = computed(() => {
    if (!this.sessions.hasValue()) return [];
    const now = this.now();
    return this.sessions.value().items.map((s) => listSession(s, now));
  });
  protected readonly more = computed(() =>
    this.sessions.hasValue() ? this.sessions.value().total - this.shown().length : 0,
  );

  /** A new session changes what's next, and when the care plan is due. */
  protected onBooked(): void {
    this.sessions.reload();
    this.carePlans.reload();
  }

  protected retry(): void {
    if (this.viewer.user.error()) this.viewer.user.reload();
    else this.sessions.reload();
  }
}
