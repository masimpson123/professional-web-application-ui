import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { CardComponent } from '@compsych-ui-components/angular';
import { Icon } from '../shared/icon';
import { HomeSections } from './home-sections';

/**
 * One section of the home page, in a ComPsych card: a heading that collapses and
 * expands it, actions beside the heading (`[slot=actions]`), and the content.
 * The ComPsych accordion only takes HTML strings, so it can't hold the session
 * rows or care plan lists; this is the same disclosure pattern, built for them.
 * Every section on the page opens and closes together (see HomeSections).
 */
@Component({
  selector: 'app-home-section',
  imports: [CardComponent, Icon],
  template: `
    <!-- \`blank\` is the card that projects its content (\`basic\` lays out its own Card Item). -->
    <compsych-card class="panel" variant="blank" padding="none">
      <div class="head">
        <h2 class="title" [id]="headingId()">
          <button
            #toggle
            type="button"
            class="toggle"
            [attr.aria-expanded]="expanded()"
            [attr.aria-controls]="bodyId()"
            (click)="setExpanded(!expanded())"
          >
            {{ heading() }}
            <app-icon class="chevron" name="chevron-down" [size]="20" />
          </button>
        </h2>
        <div class="actions"><ng-content select="[slot=actions]" /></div>
      </div>
      <div class="body" [id]="bodyId()" [hidden]="!expanded()">
        <ng-content />
      </div>
    </compsych-card>
  `,
  styleUrl: './home-section.scss',
  // A named region, like the <section aria-labelledby> each of these used to be.
  host: { role: 'region', '[attr.aria-labelledby]': 'headingId()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeSection {
  private readonly injector = inject(Injector);
  private readonly sections = inject(HomeSections);
  private readonly toggleButton = viewChild.required<ElementRef<HTMLButtonElement>>('toggle');

  /** Names the section, for its element ids, e.g. "sessions". */
  readonly key = input.required<string>();
  readonly heading = input.required<string>();

  protected readonly bodyId = () => `home-section-${this.key()}`;
  protected readonly headingId = () => `${this.bodyId()}-heading`;
  protected readonly expanded = this.sections.expanded;

  protected setExpanded(open: boolean): void {
    this.sections.setExpanded(open);
  }

  /** Opens the sections, brings this one into view, and moves focus to its heading. */
  reveal(): void {
    this.setExpanded(true);
    afterNextRender(
      () => {
        const toggle = this.toggleButton().nativeElement;
        toggle.scrollIntoView({ behavior: 'smooth', block: 'start' });
        toggle.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }
}
