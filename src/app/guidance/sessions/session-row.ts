import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChipComponent } from '@compsych-ui-components/angular';
import { personLabel } from '../api/models';
import { Viewer } from '../session/viewer';
import { GUIDANCE_SESSIONS } from '../paths';
import { Icon } from '../shared/icon';
import { ListedSession, dayLabel } from './session-listing';

/**
 * One session in a list: when, who it's with, and what it's about. Opens the
 * session: its room, or its summary once it's over.
 */
@Component({
  selector: 'app-session-row',
  imports: [ChipComponent, DatePipe, Icon, RouterLink],
  template: `
    @let s = item().session;
    <a
      class="row"
      [class.row--day]="showDay()"
      [class.row--live]="item().phase === 'live'"
      [routerLink]="[sessionsUrl, s.id]"
    >
      <span class="row__time">
        @if (showDay()) {
          <strong>{{ day() }}</strong>
          <span>{{ s.start | date: 'h:mm a' }}</span>
        } @else {
          <strong>{{ s.start | date: 'h:mm a' }}</strong>
          <span>{{ s.lengthMinutes }} min</span>
        }
      </span>
      <span class="avatar" aria-hidden="true">{{ withWhom().initials }}</span>
      <span class="row__main">
        <span class="row__name">{{ withWhomLabel() }}</span>
        <span class="row__detail">Session {{ s.number }} · {{ s.focus }}</span>
      </span>
      <span class="row__status">
        @if (item().status; as status) {
          <compsych-chip size="sm" [usage]="status.usage" [label]="status.label" />
        }
      </span>
      <span class="row__action">
        {{ action() }}
        <app-icon name="arrow-right" [size]="16" />
      </span>
    </a>
  `,
  styleUrl: './session-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionRow {
  protected readonly sessionsUrl = GUIDANCE_SESSIONS;
  private readonly viewer = inject(Viewer);

  readonly item = input.required<ListedSession>();
  /** Show the day above the time, for lists that aren't grouped by day. */
  readonly showDay = input(false);
  /** For "Today" and "Tomorrow". */
  readonly now = input(Date.now());

  /** The other person: a provider sees the member, a member sees the provider. */
  protected readonly withWhom = computed(() =>
    this.viewer.role() === 'provider' ? this.item().session.member : this.item().session.provider,
  );
  protected readonly withWhomLabel = computed(() => personLabel(this.withWhom()));
  protected readonly day = computed(() => dayLabel(this.item().session.start, this.now(), 'EEE, MMM d'));
  protected readonly action = computed(() => {
    const phase = this.item().phase;
    return phase === 'live' ? 'Join now' : phase === 'ended' ? 'View summary' : 'Open room';
  });
}
