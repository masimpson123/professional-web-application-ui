import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { directionsUrl } from '../api/models';
import { SessionStore } from '../session/session.store';
import { Icon } from '../shared/icon';

/**
 * Where a phone or in-person session happens, in the room's place for the video
 * call: who calls whom and on what number, or the office and how to get there.
 */
@Component({
  selector: 'app-session-place',
  imports: [Icon],
  template: `
    @let session = store.session();
    <section class="place" aria-labelledby="place-heading">
      <span class="place__icon"><app-icon [name]="session.format === 'phone' ? 'phone' : 'map-pin'" [size]="28" /></span>
      @if (session.format === 'phone') {
        <h2 id="place-heading" class="place__title">Phone session</h2>
        @if (store.isProvider()) {
          <p>
            Call {{ store.member().firstName }} at the session time
            @if (store.member().phone; as phone) {
              on <a class="place__link" [href]="'tel:' + phone">{{ phone }}</a>
            }.
          </p>
        } @else {
          <p>
            {{ store.provider().firstName }} will call you at the session time
            @if (store.member().phone; as phone) {
              on <strong>{{ phone }}</strong>
            }. Find somewhere private, and keep your phone nearby.
          </p>
        }
      } @else {
        <h2 id="place-heading" class="place__title">In-person session</h2>
        @if (store.provider().office; as office) {
          <p>
            {{ store.isProvider() ? 'At your office' : 'At ' + store.provider().firstName + '’s office' }}:
            <strong>{{ office.name }}</strong>
          </p>
          <address class="place__address">
            @for (line of office.address; track line) {
              <span>{{ line }}</span>
            }
          </address>
          <a class="place__link" [href]="directions()" target="_blank" rel="noopener">Get directions</a>
        }
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    .place {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-padding-sys-padding-12);
      height: 100%;
      box-sizing: border-box;
      padding: var(--spacing-padding-sys-padding-32);
      border: 1px solid var(--line);
      border-radius: var(--border-radius-sys-radius-xl);
      background: var(--surface-surface-container-sys-surface-container-lowest);
    }
    .place__icon {
      display: grid;
      place-items: center;
      width: 56px;
      aspect-ratio: 1;
      border-radius: 50%;
      background: var(--custom-info-sys-info-container);
      color: var(--custom-info-sys-on-info-container);
    }
    .place__title {
      font-size: var(--title-small-sys-font-size);
      line-height: var(--title-small-sys-line-height);
      font-weight: 500;
    }
    p {
      max-width: 52ch;
    }
    .place__address {
      display: flex;
      flex-direction: column;
      font-style: normal;
    }
    .place__link {
      color: var(--accent-primary-sys-primary);
      font-weight: 500;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionPlace {
  protected readonly store = inject(SessionStore);

  protected readonly directions = computed(() => {
    const office = this.store.provider().office;
    return office ? directionsUrl(office) : '';
  });
}
