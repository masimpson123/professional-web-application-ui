import { Component, computed, input } from '@angular/core';
import { DemoId, demoById } from '../demos';

@Component({
  selector: 'app-demo-header',
  template: `
    <header>
      <div class="intro">
        <h1>{{ demo().title }}</h1>
        <p class="summary">{{ demo().summary }}</p>
      </div>
      <dl class="spec" aria-label="How it is built">
        <div><dt>Client</dt><dd>{{ demo().client }}</dd></div>
        @if (demo().service) {
          <div><dt>Service</dt><dd>{{ demo().service }}</dd></div>
        }
        @if (demo().platform) {
          <div><dt>Platform</dt><dd>{{ demo().platform }}</dd></div>
        }
        @if (demo().origin) {
          <div><dt>Origin</dt><dd>{{ demo().origin }}</dd></div>
        }
      </dl>
    </header>
  `,
  styles: `
    header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);
      gap: 1.5rem 3rem;
      align-items: start;
      margin-bottom: 2.5rem;
    }

    .summary {
      margin-top: 0.75rem;
      color: var(--graphite);
      font-size: var(--step-1);
      max-width: 52ch;
    }

    .spec {
      margin: 0.375rem 0 0;
      font-size: var(--step--1);
      border-top: 1px solid var(--ink);
    }

    .spec div {
      display: grid;
      grid-template-columns: 5rem 1fr;
      gap: 0.75rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--rule);
    }

    dt {
      color: var(--graphite);
    }

    dd {
      margin: 0;
    }

    @media (max-width: 1100px) {
      header {
        grid-template-columns: 1fr;
      }

      .spec {
        max-width: 32rem;
      }
    }
  `,
})
export class DemoHeaderComponent {
  id = input.required<DemoId>();
  demo = computed(() => demoById(this.id()));
}
