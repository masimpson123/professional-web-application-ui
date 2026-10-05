import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Person } from '../api/models';

/**
 * The provider's short message at the top of a care plan: who it's from and
 * what they want the member to know, so the plan reads as care from someone.
 */
@Component({
  selector: 'app-provider-note',
  template: `
    <span class="avatar" aria-hidden="true">{{ from().initials }}</span>
    <p class="text"><strong>{{ from().firstName }}:</strong> {{ text() }}</p>
  `,
  styles: `
    :host {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-padding-sys-padding-12);
      padding: var(--spacing-padding-sys-padding-12) var(--spacing-padding-sys-padding-16);
      border-radius: var(--border-radius-sys-radius-md);
      background: var(--custom-info-sys-info-container);
      color: var(--custom-info-sys-on-info-container);
    }
    .avatar {
      display: grid;
      flex: none;
      place-items: center;
      width: 32px;
      aspect-ratio: 1;
      border-radius: 50%;
      background: var(--surface-surface-container-sys-surface-container-lowest);
      color: var(--accent-primary-sys-primary);
      font-size: var(--label-small-sys-font-size);
      font-weight: 500;
    }
    .text {
      align-self: center;
    }
    strong {
      font-weight: 600;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderNote {
  readonly from = input.required<Person>();
  readonly text = input.required<string>();
}
