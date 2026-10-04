import { formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardComponent } from '@compsych-ui-components/angular';
import { PageCrumbs } from '../page-crumbs';
import { GUIDANCE_SESSIONS } from '../paths';
import { Viewer } from '../session/viewer';
import { CarePlans } from './care-plans';
import { HomeCarePlans } from './home-care-plans';
import { Highlights } from './highlights';
import { YourSessions } from './your-sessions';

interface Banner {
  image: string;
  headline: string;
  description: string;
  action: string;
}

/**
 * The GuidanceResources home page, for whoever is signed in. Members are pointed
 * at their care plan for their next session; providers are welcomed to their
 * day's sessions and their members' plans.
 */
@Component({
  selector: 'app-home-page',
  imports: [CardComponent, CarePlans, Highlights, YourSessions],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [HomeCarePlans],
})
export class HomePage {
  private readonly viewer = inject(Viewer);
  private readonly router = inject(Router);
  private readonly carePlans = inject(HomeCarePlans);

  protected readonly isProvider = computed(() => this.viewer.role() === 'provider');

  protected readonly banner = computed<Banner>(() => {
    const name = this.viewer.user.hasValue() ? ` ${this.viewer.user.value().firstName}` : '';
    const headline = `Welcome Back${name}`;
    if (this.isProvider()) {
      return {
        image: 'guidance/welcome-provider.svg',
        headline,
        description: 'Thank you for the care you give. Your sessions and your members’ care plans are all here.',
        action: 'View Your Sessions',
      };
    }
    return { image: 'guidance/welcome.jpg', headline, ...this.carePlanNudge() };
  });

  /** Members: what's left of their care plan, and when it's due. */
  private carePlanNudge(): Pick<Banner, 'description' | 'action'> {
    const plan = this.carePlans.plans()[0]; // soonest session first
    if (!plan) {
      return {
        description: 'After your first session, the care plan your provider gives you will be here.',
        action: 'See Your Care Plan',
      };
    }
    const from = plan.provider.firstName;
    const when = plan.nextSession && formatDate(plan.nextSession, 'EEEE, MMMM d', 'en-US');
    const left = plan.items.filter((item) => !item.done).length;
    const remaining = `${left} ${left === 1 ? 'item is' : 'items are'} left to complete.`;
    if (!left) {
      return {
        description: when
          ? `You’ve completed your care plan from ${from}. You’re ready for your session on ${when}.`
          : `You’ve completed your care plan from ${from}.`,
        action: 'Review Your Care Plan',
      };
    }
    return {
      description: when
        ? `Complete your care plan from ${from} before your session on ${when}. ${remaining}`
        : `Complete your care plan from ${from}. ${remaining}`,
      action: 'Complete Your Care Plan',
    };
  }

  protected readonly journeys = [
    { id: 'connect', icon: 'handshake', title: 'Connect Me', subtitle: 'to live services & care options' },
    { id: 'guide', icon: 'compass', title: 'Guide Me', subtitle: 'to my resources and services' },
    { id: 'assess', icon: 'binoculars', title: 'Assess Me', subtitle: 'based on my unique profile and needs' },
  ];

  constructor() {
    inject(PageCrumbs).trail.set([]);
  }

  protected onBannerAction(carePlans: CarePlans): void {
    if (this.isProvider()) this.router.navigateByUrl(GUIDANCE_SESSIONS);
    else carePlans.focus();
  }
}
