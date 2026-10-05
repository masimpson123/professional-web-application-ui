import { formatDate } from '@angular/common';
import { DestroyRef, Signal, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { BadgeVariant } from '@compsych-ui-components/angular';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  concat,
  exhaustMap,
  map,
  of,
  scan,
  startWith,
  switchMap,
} from 'rxjs';
import { ApiService } from '../api/api.service';
import { Page, SessionPhase, SessionSummary, SessionWhen, sessionPhase } from '../api/models';
import { Viewer } from '../session/viewer';

/** A session as a list row shows it. */
export interface ListedSession {
  session: SessionSummary;
  phase: SessionPhase;
  /** Only for what's happening now or very soon. */
  status?: { label: string; variant: BadgeVariant };
}

export interface SessionDay {
  /** yyyy-mm-dd, local. */
  key: string;
  /** "Today", "Tomorrow", "Yesterday", or "Thursday, October 8". */
  label: string;
  sessions: ListedSession[];
}

/** What a `SessionFeed` has loaded so far. */
export interface FeedState {
  items: SessionSummary[];
  /** How many there are on the server, across all pages. */
  total: number;
  /** The first page has arrived. */
  loaded: boolean;
  loading: boolean;
  failed: boolean;
  /** Every page has been loaded. */
  done: boolean;
}

const EMPTY_FEED: FeedState = {
  items: [],
  total: 0,
  loaded: false,
  loading: true,
  failed: false,
  done: false,
};

/**
 * The viewer's sessions, one server page at a time, for lists that keep going
 * (like years of past sessions). Pages build on each other through one stream:
 * a new viewer restarts it (`switchMap`), and asking for more while a page is
 * on its way does nothing (`exhaustMap`). Create in an injection context.
 */
export class SessionFeed {
  private readonly api = inject(ApiService);
  private readonly more$ = new Subject<void>();
  /** Bumped to start over from the first page, e.g. after booking a session. */
  private readonly version = signal(0);

  readonly state: Signal<FeedState>;

  constructor(
    private readonly when: SessionWhen,
    private readonly pageSize = 20,
  ) {
    const viewer = inject(Viewer);
    const source = computed(() => ({
      personId: viewer.user.hasValue() ? viewer.user.value().id : undefined,
      version: this.version(),
    }));
    this.state = toSignal(
      toObservable(source).pipe(
        switchMap(({ personId }) => (personId ? this.pages(personId) : of(EMPTY_FEED))),
      ),
      { initialValue: EMPTY_FEED },
    );
  }

  /** Starts over from the first page. */
  reload(): void {
    this.version.update((v) => v + 1);
  }

  /** Loads the next page, unless one is loading or there are no more. Also retries a failed page. */
  loadMore(): void {
    this.more$.next();
  }

  private pages(personId: string): Observable<FeedState> {
    let cursor: string | undefined;
    let done = false;
    type Step = { page: Page<SessionSummary> } | { failed: true } | { loading: true };

    return this.more$.pipe(
      startWith(undefined),
      exhaustMap(() =>
        done
          ? EMPTY
          : concat(
              of<Step>({ loading: true }),
              this.api.getSessions(personId, { when: this.when, limit: this.pageSize, cursor }).pipe(
                map((page): Step => {
                  cursor = page.nextCursor;
                  done = !page.nextCursor;
                  return { page };
                }),
                catchError(() => of<Step>({ failed: true })),
              ),
            ),
      ),
      scan(
        (feed, step): FeedState =>
          'page' in step
            ? {
                items: [...feed.items, ...step.page.items],
                total: step.page.total,
                loaded: true,
                loading: false,
                failed: false,
                done,
              }
            : 'failed' in step
              ? { ...feed, loading: false, failed: true }
              : { ...feed, loading: true, failed: false },
        EMPTY_FEED,
      ),
    );
  }
}

/** The time, updated every `everyMs`, so "Starts in 10 min" stays true. Call in an injection context. */
export function injectNow(everyMs = 30_000): Signal<number> {
  const now = signal(Date.now());
  const timer = setInterval(() => now.set(Date.now()), everyMs);
  inject(DestroyRef).onDestroy(() => clearInterval(timer));
  return now.asReadonly();
}

export function listSession(session: SessionSummary, now: number): ListedSession {
  const phase = sessionPhase(session, now);
  const minutesAway = Math.ceil((Date.parse(session.start) - now) / 60_000);
  const status: ListedSession['status'] =
    phase === 'live' ? { label: 'In progress', variant: 'positive' }
    : phase === 'upcoming' && minutesAway <= 60 ? { label: `Starts in ${minutesAway} min`, variant: 'filled' }
    : undefined;
  return { session, phase, status };
}

/** Groups sessions by local day, keeping their order. */
export function groupByDay(sessions: ListedSession[], now: number): SessionDay[] {
  const days = new Map<string, SessionDay>();
  for (const item of sessions) {
    const key = formatDate(item.session.start, 'yyyy-MM-dd', 'en-US');
    let day = days.get(key);
    if (!day) {
      day = { key, label: dayLabel(item.session.start, now, 'EEEE, MMMM d'), sessions: [] };
      days.set(key, day);
    }
    day.sessions.push(item);
  }
  return [...days.values()];
}

/** "Today", "Tomorrow" or "Yesterday", otherwise the date in `format`, with the year if it isn't this one. */
export function dayLabel(start: string, now: number, format: string): string {
  const days = Math.round((dayStart(start) - dayStart(now)) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  const otherYear = new Date(start).getFullYear() !== new Date(now).getFullYear();
  return formatDate(start, otherYear ? `${format}, y` : format, 'en-US');
}

function dayStart(at: string | number): number {
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
