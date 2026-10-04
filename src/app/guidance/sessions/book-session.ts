import { DatePipe, formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  model,
  output,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ButtonComponent, DialogComponent, TextInputComponent } from '@compsych-ui-components/angular';
import { ApiService } from '../api/api.service';
import { SessionSummary, TimeSlot, personLabel } from '../api/models';
import { Viewer } from '../session/viewer';

interface Day {
  /** yyyy-mm-dd, local. */
  key: string;
  slots: TimeSlot[];
}

/**
 * How a member books a session with their provider, like Calendly: pick a day,
 * pick one of the provider's open times, optionally say what to focus on, and
 * confirm. The new session gets its own room and shows up in their sessions.
 */
@Component({
  selector: 'app-book-session',
  imports: [ButtonComponent, DatePipe, DialogComponent, TextInputComponent],
  templateUrl: './book-session.html',
  styleUrl: './book-session.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookSession {
  private readonly api = inject(ApiService);
  private readonly viewer = inject(Viewer);

  readonly open = model(false);
  /** A session was booked. */
  readonly booked = output<SessionSummary>();

  private readonly memberId = computed(() =>
    this.viewer.user.hasValue() ? this.viewer.user.value().id : undefined,
  );
  private readonly providers = rxResource({
    params: () => (this.open() ? this.memberId() : undefined),
    stream: ({ params }) => this.api.getProviders(params),
  });
  /** Members book with the provider they're working with. */
  protected readonly provider = computed(() =>
    this.providers.hasValue() ? this.providers.value()[0] : undefined,
  );
  protected readonly slots = rxResource({
    params: () => this.provider()?.id,
    stream: ({ params }) => this.api.getAvailability(params),
  });

  /** Days with at least one open time. */
  protected readonly days = computed<Day[]>(() => {
    const days = new Map<string, Day>();
    for (const slot of this.slots.hasValue() ? this.slots.value() : []) {
      const key = formatDate(slot.start, 'yyyy-MM-dd', 'en-US');
      days.set(key, { key, slots: [...(days.get(key)?.slots ?? []), slot] });
    }
    return [...days.values()];
  });
  /** The first open day, until the member picks another. */
  protected readonly dayKey = linkedSignal(() => this.days()[0]?.key);
  protected readonly day = computed(() => this.days().find((d) => d.key === this.dayKey()));
  /** Cleared whenever the day changes. */
  protected readonly time = linkedSignal<string | undefined, string | undefined>({
    source: this.dayKey,
    computation: () => undefined,
  });
  protected readonly focus = signal('');

  protected readonly booking = signal(false);
  protected readonly error = signal('');
  protected readonly confirmed = signal<SessionSummary | undefined>(undefined);

  protected readonly view = computed(() => {
    if (this.providers.error() || this.slots.error()) return 'failed';
    if (!this.providers.hasValue() || (this.provider() && !this.slots.hasValue())) return 'loading';
    if (!this.provider()) return 'no-provider';
    return this.days().length ? 'choose' : 'full';
  });

  protected readonly title = computed(() => {
    const provider = this.provider();
    return provider ? `Book a session with ${personLabel(provider)}` : 'Book a session';
  });

  protected readonly bookLabel = computed(() => {
    const time = this.time();
    return time ? `Book ${formatDate(time, 'EEE, MMM d', 'en-US')} at ${formatDate(time, 'h:mm a', 'en-US')}` : 'Book session';
  });

  /** "Central Daylight Time": the times shown are the member's own. */
  protected readonly timeZone =
    new Intl.DateTimeFormat('en-US', { timeZoneName: 'long' })
      .formatToParts(new Date())
      .find((part) => part.type === 'timeZoneName')?.value ?? 'your time zone';

  protected book(): void {
    const memberId = this.memberId();
    const provider = this.provider();
    const start = this.time();
    if (!memberId || !provider || !start || this.booking()) return;
    this.booking.set(true);
    this.error.set('');
    this.api
      .bookSession({ memberId, providerId: provider.id, start, focus: this.focus() })
      .subscribe({
        next: (session) => {
          this.booking.set(false);
          this.confirmed.set(session);
          this.booked.emit(session);
        },
        error: (err: { status?: number }) => {
          this.booking.set(false);
          if (err.status === 409) {
            this.error.set('Someone just booked that time. Pick another one.');
            this.slots.reload();
          } else {
            this.error.set('We couldn’t book that time. Check your internet connection, then try again.');
          }
        },
      });
  }

  protected retry(): void {
    if (this.providers.error()) this.providers.reload();
    else this.slots.reload();
  }

  /** Closes and starts fresh next time. */
  protected close(): void {
    this.open.set(false);
    this.focus.set('');
    this.error.set('');
    this.confirmed.set(undefined);
  }
}
