import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ButtonComponent } from '@compsych-ui-components/angular';
import { CallService } from '../call/call.service';
import { SessionStore } from '../session/session.store';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-video-stage',
  imports: [ButtonComponent, Icon],
  templateUrl: './video-stage.html',
  styleUrl: './video-stage.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // <video-player-container> is a custom element registered by the Zoom Video SDK.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class VideoStage {
  protected readonly store = inject(SessionStore);
  protected readonly call = inject(CallService);

  private readonly gallery = viewChild.required<ElementRef<HTMLElement>>('gallery');
  private readonly selfView = viewChild.required<ElementRef<HTMLElement>>('selfView');
  private readonly shareView = viewChild.required<ElementRef<HTMLElement>>('shareView');

  protected readonly connected = computed(() => this.call.status() === 'connected');
  protected readonly anyoneSharing = computed(() => this.call.sharing() || !!this.call.remoteSharer());
  /** Gallery columns: the smallest square grid that fits everyone else. */
  protected readonly columns = computed(() =>
    Math.max(1, Math.ceil(Math.sqrt(this.call.remotes().length))),
  );

  private readonly now = signal(Date.now());
  private readonly sessionSeconds = computed(() => this.store.session().lengthMinutes * 60);
  /** Time since the booked start, from 0 before it begins to the full length after it ends. */
  private readonly elapsedSeconds = computed(() => {
    const seconds = Math.floor((this.now() - Date.parse(this.store.session().start)) / 1000);
    return Math.min(Math.max(seconds, 0), this.sessionSeconds());
  });

  protected readonly clock = computed(() => {
    const s = this.elapsedSeconds();
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  });
  protected readonly elapsedMinutes = computed(() => Math.floor(this.elapsedSeconds() / 60));
  protected readonly elapsedFraction = computed(() => this.elapsedSeconds() / this.sessionSeconds());
  protected readonly minutesLeft = computed(() =>
    Math.ceil((this.sessionSeconds() - this.elapsedSeconds()) / 60),
  );

  constructor() {
    afterNextRender(() =>
      this.call.setViews({
        remote: (userId) =>
          this.gallery().nativeElement.querySelector<HTMLElement>(`[data-user-id="${userId}"]`) ??
          undefined,
        self: this.selfView().nativeElement,
        share: this.shareView().nativeElement,
      }),
    );

    // Switching views in the demo makes you the other person: hang up first.
    let firstRole = true;
    effect(() => {
      this.store.role();
      if (firstRole) {
        firstRole = false;
        return;
      }
      untracked(() => this.call.leave());
    });

    const timer = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      this.call.leave();
    });
  }

  /** "Jordan Reyes" → "JR". */
  protected initials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    const letters = words.length > 1 ? [words[0], words.at(-1)!] : words;
    return letters.map((w) => w[0].toUpperCase()).join('') || '?';
  }

  protected join(): void {
    this.call.join({
      room: this.store.session().zoomRoom,
      displayName: this.store.me().name,
      isHost: this.store.isProvider(),
      others: [this.store.them().name],
    });
  }
}
