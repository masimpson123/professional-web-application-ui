import { formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CardComponent } from '@compsych-ui-components/angular';
import { ApiService } from '../api/api.service';
import { PageCrumbs } from '../page-crumbs';
import { GUIDANCE_NEW_MEMBER_CHECK_IN, GUIDANCE_SESSIONS } from '../paths';
import { dayLabel } from '../sessions/session-listing';
import { Viewer } from '../session/viewer';
import { CarePlans } from './care-plans';
import { HomeCarePlans, planProgress } from './home-care-plans';
import { HomeSections } from './home-sections';
import { Highlights } from './highlights';
import { YourSessions } from './your-sessions';

interface Banner {
  image: string;
  headline: string;
  description: string;
  action: string;
  /** A deadline chip at the top of the banner, for something that's due. */
  due?: string;
  actionIcon?: string;
}

/**
 * The GuidanceResources home page, for whoever is signed in. Members are pointed
 * at their pre-session check-in when one is due, and otherwise at their care plan
 * for their next session; providers are welcomed to their day's sessions and
 * their members' plans.
 */
@Component({
  selector: 'app-home-page',
  imports: [CardComponent, CarePlans, Highlights, YourSessions],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [HomeCarePlans, HomeSections],
})
export class HomePage {
  private readonly viewer = inject(Viewer);
  private readonly router = inject(Router);
  private readonly carePlans = inject(HomeCarePlans);
  private readonly api = inject(ApiService);

  protected readonly isProvider = computed(() => this.viewer.role() === 'provider');

  /** Members: whether they've done their new member check-in (it's done once). */
  private readonly newMemberCheckIn = rxResource({
    params: () =>
      !this.isProvider() && this.viewer.user.hasValue() ? this.viewer.user.value().id : undefined,
    stream: ({ params }) => this.api.getNewMemberCheckIn(params),
  });
  /** The session it should be done before, while it isn't done. */
  private readonly dueSession = computed(() => {
    const status = this.newMemberCheckIn.hasValue() ? this.newMemberCheckIn.value() : undefined;
    return status && !status.completedAt ? status.nextSession : undefined;
  });

  protected readonly banner = computed<Banner>(() => {
    const name = this.viewer.user.hasValue() ? ` ${this.viewer.user.value().firstName}` : '';
    const headline = `Welcome Back${name}`;
    if (this.isProvider()) {
      return {
        image: 'telehealth/welcome-provider.svg',
        headline,
        description: 'Thank you for the care you give. Your sessions and your members’ care plans are all here.',
        action: 'View Your Sessions',
      };
    }
    return { image: 'telehealth/welcome.jpg', ...(this.checkInNudge() ?? { headline, ...this.carePlanNudge() }) };
  });

  /**
   * Members: the new member check-in, until they've done it (it's done once). It
   * takes over the banner (headline included) and names the deadline, their next
   * session, which tightens from the date to "tomorrow" to "today", so it isn't
   * skimmed past as a greeting.
   */
  private checkInNudge(): Omit<Banner, 'image'> | undefined {
    const session = this.dueSession();
    if (!session) return undefined;
    const now = Date.now();
    const day = dayLabel(session.start, now, 'EEEE'); // "Today", "Tomorrow" or "Monday"
    const time = formatDate(session.start, 'h:mm a', 'en-US');
    const due =
      day === 'Today' ? `Due today, before ${time}`
      : day === 'Tomorrow' ? 'Due tomorrow'
      : `Due by ${formatDate(session.start, 'EEE, MMM d', 'en-US')}`;
    const whose = day === 'Today' ? 'Today’s' : day === 'Tomorrow' ? 'Tomorrow’s' : `${day}’s`;
    const provider = session.provider.firstName;
    return {
      headline: `Check In Before ${whose} Session`,
      description: `This one-time check-in takes about 5 minutes and saves time in your appointment: ${provider} sees your answers first, so your session at ${time} can start with what matters most.`,
      action: 'Complete Your New Member Check-In',
      actionIcon: 'clipboard-pen',
      due,
    };
  }

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
    const { done, total } = planProgress(plan);
    const left = total - done;
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
    const due = this.dueSession();
    if (this.isProvider()) this.router.navigateByUrl(GUIDANCE_SESSIONS);
    else if (due) this.router.navigateByUrl(GUIDANCE_NEW_MEMBER_CHECK_IN);
    else carePlans.focus();
  }
}
