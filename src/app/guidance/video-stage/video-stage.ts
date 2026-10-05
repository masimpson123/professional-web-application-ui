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
import { AiScribeConsent } from '../api/models';
import { CallService } from '../call/call.service';
import { SessionStore } from '../session/session.store';
import { Settings } from '../session/settings';
import { Icon } from '../shared/icon';
import { AiScribeConsentDialog } from './ai-scribe-consent';

@Component({
  selector: 'app-video-stage',
  imports: [AiScribeConsentDialog, ButtonComponent, Icon],
  templateUrl: './video-stage.html',
  styleUrl: './video-stage.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // <video-player-container> is a custom element registered by the Zoom Video SDK.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class VideoStage {
  protected readonly store = inject(SessionStore);
  protected readonly call = inject(CallService);
  private readonly settings = inject(Settings);

  /**
   * Full screen: just the call, with the care plan and the rest of the page out of
   * sight, for focusing on the session. Uses the browser's full screen where it can
   * (Esc leaves it too); elsewhere (iPhone Safari) the stage fills the window.
   */
  protected readonly fullScreen = signal(false);
  private usingBrowserFullScreen = false;

  /** The member is being asked about AI scribe before they join. */
  protected readonly askingConsent = signal(false);
  /** Members: a change to AI notes from the call controls is being saved. */
  protected readonly savingAiScribe = signal(false);

  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly gallery = viewChild.required<ElementRef<HTMLElement>>('gallery');
  private readonly selfView = viewChild.required<ElementRef<HTMLElement>>('selfView');

  protected readonly connected = computed(() => this.call.status() === 'connected');
  /** Gallery columns: the smallest square grid that fits everyone else. */
  protected readonly columns = computed(() =>
    Math.max(1, Math.ceil(Math.sqrt(this.call.remotes().length))),
  );

  constructor() {
    // "Join Now" on the home page opens the room asking to join straight away (router state).
    afterNextRender(() => {
      if ((history.state as { join?: boolean } | null)?.join && this.call.status() === 'ready') {
        history.replaceState({ ...history.state, join: false }, ''); // not again on reload
        this.join();
      }
    });

    afterNextRender(() =>
      this.call.setViews({
        remote: (userId) =>
          this.gallery().nativeElement.querySelector<HTMLElement>(`[data-user-id="${userId}"]`) ??
          undefined,
        self: this.selfView().nativeElement,
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

    // Keep in step when the browser leaves full screen on its own (Esc, or its own controls).
    const onFullScreenChange = () => {
      if (this.usingBrowserFullScreen && !document.fullscreenElement) {
        this.usingBrowserFullScreen = false;
        this.fullScreen.set(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullScreenChange);

    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('fullscreenchange', onFullScreenChange);
      this.exitFullScreen();
      this.call.leave();
    });
  }

  /** "Jordan Reyes" → "JR". */
  protected initials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    const letters = words.length > 1 ? [words[0], words.at(-1)!] : words;
    return letters.map((w) => w[0].toUpperCase()).join('') || '?';
  }

  /**
   * Members are asked about AI scribe first, unless they've answered for this
   * session already (say, before rejoining) or saved an answer in My profile,
   * which then applies to this session.
   */
  protected join(): void {
    if (this.store.isProvider() || this.store.aiScribe()) return this.connect();
    const saved = this.settings.aiScribe();
    if (!saved) {
      // The prompt opens outside the stage, where browser full screen would hide it.
      this.exitFullScreen();
      return this.askingConsent.set(true);
    }
    this.store.setAiScribe(saved).subscribe({ error: () => undefined });
    this.connect();
  }

  protected toggleFullScreen(): void {
    if (this.fullScreen()) return this.exitFullScreen();
    const stage = this.stage().nativeElement;
    this.fullScreen.set(true);
    if (document.fullscreenEnabled && stage.requestFullscreen) {
      this.usingBrowserFullScreen = true;
      // If the browser says no, the stage still fills the window.
      stage.requestFullscreen().catch(() => (this.usingBrowserFullScreen = false));
    }
  }

  private exitFullScreen(): void {
    if (this.usingBrowserFullScreen && document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    this.usingBrowserFullScreen = false;
    this.fullScreen.set(false);
  }

  /** Members, during the call: turn AI notes off, or back on, for this session. */
  protected toggleAiScribe(): void {
    const next: AiScribeConsent = this.store.aiScribe() === 'allowed' ? 'declined' : 'allowed';
    this.savingAiScribe.set(true);
    this.store.setAiScribe(next).subscribe({
      next: () => this.savingAiScribe.set(false),
      error: () => this.savingAiScribe.set(false),
    });
  }

  protected connect(): void {
    this.call.join({
      room: this.store.session().zoomRoom,
      displayName: this.store.me().name,
      isHost: this.store.isProvider(),
    });
  }
}
