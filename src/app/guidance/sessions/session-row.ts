import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BadgeComponent, ButtonComponent } from '@compsych-ui-components/angular';
import { SessionSummary, personLabel, sessionEnd } from '../api/models';
import { Viewer } from '../session/viewer';
import { GUIDANCE_SESSIONS } from '../paths';
import { Icon } from '../shared/icon';
import { FORMAT_ICON, formatNote } from './session-format';
import { ListedSession, dayLabel } from './session-listing';

/**
 * One session in a list: when, who it's with, and what it's about, plus, for a
 * phone or in-person session, who calls whom or where to go. By default the
 * row opens the session: its room, or its summary once it's over. With `actions`
 * (the home page) it has buttons instead: Join Now for a video session, which opens
 * from 30 minutes before the start until the end, and, for members, the session's
 * pre-session check-in: "Pre-Session Check-In" until it's done, "Edit Check-In" after.
 */
/** How early Join Now opens. */
const JOIN_OPENS_MS = 30 * 60_000;

@Component({
  selector: 'app-session-row',
  imports: [BadgeComponent, ButtonComponent, DatePipe, Icon, NgTemplateOutlet, RouterLink],
  template: `
    @let s = item().session;
    @if (actions()) {
      <div class="row" [class.row--day]="showDay()" [class.row--live]="item().phase === 'live'">
        <ng-container *ngTemplateOutlet="details" />
        <span class="row__buttons">
          @if (canCheckIn()) {
            <compsych-button
              variant="outlined"
              size="small"
              [label]="s.checkInFocus ? 'Edit Check-In' : 'Pre-Session Check-In'"
              (click)="checkIn.emit(s)"
            />
          }
          @if (s.format === 'video') {
            <compsych-button
              variant="filled"
              size="small"
              label="Join Now"
              [disabled]="!joinOpen()"
              [ariaLabel]="joinOpen() ? 'Join now' : 'Join now, opens 30 minutes before the session'"
              [attr.title]="joinOpen() ? null : 'Opens 30 minutes before your session'"
              (click)="join()"
            />
          }
        </span>
      </div>
    } @else {
      <a
        class="row"
        [class.row--day]="showDay()"
        [class.row--live]="item().phase === 'live'"
        [routerLink]="[sessionsUrl, s.id]"
      >
        <ng-container *ngTemplateOutlet="details" />
        <span class="row__action">
          {{ action() }}
          <app-icon name="arrow-right" [size]="16" />
        </span>
      </a>
    }

    <ng-template #details>
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
        @if (note(); as note) {
          <span class="row__where">
            <app-icon [name]="formatIcon[s.format]" [size]="14" />
            {{ note }}
          </span>
        }
      </span>
      <span class="row__status">
        @if (item().status; as status) {
          <compsych-badge size="md" [variant]="status.variant" [label]="status.label" />
        }
      </span>
    </ng-template>
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
  /** For "Today" and "Tomorrow", and whether Join Now is open. */
  readonly now = input(Date.now());
  /** Buttons instead of a link to the session (the home page). */
  readonly actions = input(false);
  /** The member chose the session's pre-session check-in (to do or edit it). */
  readonly checkIn = output<SessionSummary>();

  private readonly router = inject(Router);

  /** The other person: a provider sees the member, a member sees the provider. */
  protected readonly withWhom = computed(() =>
    this.viewer.role() === 'provider' ? this.item().session.member : this.item().session.provider,
  );
  protected readonly withWhomLabel = computed(() => personLabel(this.withWhom()));
  /** Members can do or edit a session's pre-session check-in any time before it ends. */
  protected readonly canCheckIn = computed(
    () => this.viewer.role() === 'member' && this.item().phase !== 'ended',
  );
  protected readonly day = computed(() => dayLabel(this.item().session.start, this.now(), 'EEE, MMM d'));
  /** From 30 minutes before the start until the session ends. */
  protected readonly joinOpen = computed(() => {
    const session = this.item().session;
    return this.now() >= Date.parse(session.start) - JOIN_OPENS_MS && this.now() < sessionEnd(session);
  });

  /** Opens the room and starts joining (see VideoStage), the way the room's own Join button does. */
  protected join(): void {
    if (!this.joinOpen()) return;
    this.router.navigate([this.sessionsUrl, this.item().session.id], { state: { join: true } });
  }

  protected readonly formatIcon = FORMAT_ICON;
  /** Who calls whom, or where to go; nothing for video, which is joined here. */
  protected readonly note = computed(() => formatNote(this.item().session, this.viewer.role()));

  protected readonly action = computed(() => {
    const phase = this.item().phase;
    // Nothing to join here for a phone or in-person session; the room has its details.
    if (this.item().session.format !== 'video' && phase !== 'ended') return 'View details';
    return phase === 'live' ? 'Join now' : phase === 'ended' ? 'View summary' : 'Open room';
  });
}
