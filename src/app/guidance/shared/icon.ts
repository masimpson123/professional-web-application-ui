import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LUCIDE_ICONS } from '@compsych-ui-components/shared/assets/lucide-icons.generated';

/**
 * Renders a Lucide icon from the same icon set the ComPsych components use.
 * Decorative by default; pass `label` when the icon carries meaning on its own.
 */
@Component({
  selector: 'app-icon',
  template: '',
  host: {
    '[innerHTML]': 'svg()',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
    '[style.--icon-size.px]': 'size()',
  },
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      width: var(--icon-size);
      height: var(--icon-size);
    }
    :host ::ng-deep svg {
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<string>();
  readonly size = input(20);
  readonly label = input<string>();

  // Icon markup is static, build-time library content, so it's safe to trust.
  protected readonly svg = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(LUCIDE_ICONS[this.name()] ?? ''),
  );
}
