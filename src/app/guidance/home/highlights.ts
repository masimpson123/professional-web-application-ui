import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CardComponent } from '@compsych-ui-components/angular';
import { ApiService } from '../api/api.service';
import { Viewer } from '../session/viewer';
import { Icon } from '../shared/icon';

const ADVANCE_MS = 8000;

/**
 * The home page's featured articles, one at a time, chosen for whoever is signed
 * in: health topics for members, ComPsych resources for providers. Advances on
 * its own unless paused, hovered or focused, or the user prefers reduced motion
 * (WCAG 2.2.2).
 */
@Component({
  selector: 'app-highlights',
  imports: [CardComponent, Icon],
  templateUrl: './highlights.html',
  styleUrl: './highlights.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'region',
    'aria-roledescription': 'carousel',
    'aria-label': 'Highlights',
    '(mouseenter)': 'held.set(true)',
    '(mouseleave)': 'held.set(false)',
    '(focusin)': 'held.set(true)',
    '(focusout)': 'held.set(false)',
  },
})
export class Highlights {
  private readonly api = inject(ApiService);
  private readonly viewer = inject(Viewer);
  protected readonly slides = rxResource({
    params: () => this.viewer.role(),
    stream: ({ params }) => this.api.getHighlights(params),
  });

  /** The slide showing; back to the first whenever a new set of slides arrives. */
  protected readonly index = linkedSignal({
    source: () => (this.slides.hasValue() ? this.slides.value() : undefined),
    computation: () => 0,
  });
  protected readonly paused = signal(matchMedia('(prefers-reduced-motion: reduce)').matches);
  /** Hovered or focused: hold still while someone is reading or using it. */
  protected readonly held = signal(false);

  protected readonly count = computed(() => (this.slides.hasValue() ? this.slides.value().length : 0));

  constructor() {
    const timer = setInterval(() => {
      if (!this.paused() && !this.held()) this.step(1);
    }, ADVANCE_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected step(by: number): void {
    const count = this.count();
    if (count) this.index.update((i) => (i + by + count) % count);
  }
}
