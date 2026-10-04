import { DestroyRef, Directive, ElementRef, afterNextRender, inject, output } from '@angular/core';

/**
 * Emits `visible` when the element comes within `rootMargin` of the viewport, for
 * loading the next page of a long list before the reader reaches the end.
 *
 * It also emits straight away if the element starts out visible, so render it
 * only while there's more to load and nothing is loading: each new page then
 * brings a fresh sentinel, which keeps loading until the viewport is full.
 */
@Directive({ selector: '[appWhenVisible]' })
export class WhenVisible {
  readonly visible = output<void>();

  constructor() {
    const element = inject(ElementRef<HTMLElement>).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) this.visible.emit();
        },
        { rootMargin: '400px 0px' },
      );
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
