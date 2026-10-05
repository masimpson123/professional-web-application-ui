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

  protected readonly connected = computed(() => this.call.status() === 'connected');
  /** Gallery columns: the smallest square grid that fits everyone else. */
  protected readonly columns = computed(() =>
    Math.max(1, Math.ceil(Math.sqrt(this.call.remotes().length))),
  );

  constructor() {
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

    inject(DestroyRef).onDestroy(() => this.call.leave());
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
    });
  }
}
