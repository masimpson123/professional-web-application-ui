import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ButtonComponent } from '@compsych-ui-components/angular';
import { CallService } from '../call/call.service';
import { ZoomCall } from '../call/zoom-call';
import { ZoomTokens } from '../call/zoom-tokens';
import { CarePlanPanel } from '../care-plan/care-plan-panel';
import { PageCrumbs } from '../page-crumbs';
import { GUIDANCE_SESSIONS } from '../paths';
import { PastSessionView } from '../past-session/past-session-view';
import { SessionPlace } from './session-place';
import { ApiService } from '../api/api.service';
import { personLabel, sessionEnd, sessionPhase } from '../api/models';
import { SessionStore } from '../session/session.store';
import { Viewer } from '../session/viewer';
import { VideoStage } from '../video-stage/video-stage';

/**
 * One session. Until it's over that's its room: a video call (or, for a phone or
 * in-person session, where it happens) beside its documents; afterwards it's a
 * summary of what happened and what was shared.
 */
@Component({
  selector: 'app-room-page',
  imports: [ButtonComponent, CarePlanPanel, PastSessionView, RouterLink, SessionPlace, VideoStage],
  templateUrl: './room-page.html',
  styleUrl: './room-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Every visit gets its own session state and call.
  providers: [
    SessionStore,
    ZoomTokens,
    { provide: CallService, useClass: ZoomCall },
  ],
})
export class RoomPage {
  protected readonly sessionsUrl = GUIDANCE_SESSIONS;
  /**
   * The session id, from `/sessions/:id`. Read from the route rather than bound as an
   * input, because the portfolio doesn't turn on `withComponentInputBinding()`.
   */
  private readonly id = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('id') ?? '')),
    { requireSync: true },
  );

  protected readonly store = inject(SessionStore);
  private readonly api = inject(ApiService);
  private readonly viewer = inject(Viewer);

  private readonly detail = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.api.getSession(params),
  });

  /**
   * What the page shows. A real API would refuse a session you aren't booked
   * into; the demo API serves any, so that's checked here.
   */
  protected readonly view = computed(() => {
    const error = this.detail.error() ?? this.viewer.user.error();
    if (error) return (error as { status?: number }).status === 404 ? 'missing' : 'failed';
    if (!this.detail.hasValue() || !this.viewer.user.hasValue()) return 'loading';

    const { provider, member } = this.detail.value();
    const me = this.viewer.user.value().id;
    if (me !== provider.id && me !== member.id) return 'missing';
    if (!this.store.loaded()) return 'loading';
    return this.endedWhenOpened() ? 'past' : 'room';
  });

  /**
   * Decided once, when the session loads (nothing here changes after that), so a
   * call that runs past the booked end isn't cut off.
   */
  private readonly endedWhenOpened = computed(
    () => sessionPhase(this.store.session()) === 'ended',
  );

  /** "Session 4 with Maya Okafor, LPC" */
  protected readonly title = computed(() => {
    return `Session ${this.store.session().number} with ${personLabel(this.store.them())}`;
  });

  /** "Sunday, October 4, 2:00–2:50 PM" */
  protected readonly when = computed(() => {
    const session = this.store.session();
    const time = (at: string | number, format: string) => formatDate(at, format, 'en-US');
    return `${time(session.start, 'EEEE, MMMM d, h:mm')}–${time(sessionEnd(session), 'h:mm a')}`;
  });

  constructor() {
    const crumbs = inject(PageCrumbs);
    effect(() => {
      const detail = this.detail.hasValue() ? this.detail.value() : undefined;
      untracked(() => {
        if (detail) this.store.open(detail);
        crumbs.trail.set([
          { id: GUIDANCE_SESSIONS, label: 'Sessions', kind: 'link' },
          { id: 'current', label: detail ? `Session ${detail.session.number}` : 'Session', kind: 'current' },
        ]);
      });
    });
  }

  protected retry(): void {
    if (this.viewer.user.error()) this.viewer.user.reload();
    this.detail.reload();
  }
}
