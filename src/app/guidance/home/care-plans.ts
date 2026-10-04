import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ButtonComponent } from '@compsych-ui-components/angular';
import { CarePlan, personLabel } from '../api/models';
import { AddToCarePlan } from '../care-plan/add-to-care-plan';
import { CarePlanList } from '../care-plan/care-plan-list';
import { Viewer } from '../session/viewer';
import { Icon } from '../shared/icon';
import { HomeCarePlans, planProgress } from './home-care-plans';

/**
 * Care plans on the home page. A member works through theirs here; a provider
 * follows every member's progress, adds documents to their plans, and takes
 * items out.
 */
@Component({
  selector: 'app-care-plans',
  imports: [AddToCarePlan, ButtonComponent, CarePlanList, DatePipe, Icon],
  templateUrl: './care-plans.html',
  styleUrl: './care-plans.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarePlans {
  protected readonly store = inject(HomeCarePlans);
  protected readonly role = inject(Viewer).role;
  protected readonly personLabel = personLabel;
  protected readonly progress = planProgress;

  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  /** The member whose plan the provider is adding to, while the resource search is open. */
  protected readonly addingTo = signal<CarePlan | undefined>(undefined);
  /** The latest copy of that plan, so the search knows what's in it already. */
  protected readonly addingPlan = () =>
    this.store.plans().find((p) => p.member.id === this.addingTo()?.member.id);

  /** Brings the section into view and moves focus to it, e.g. from the welcome banner. */
  focus(): void {
    const heading = this.heading().nativeElement;
    heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    heading.focus({ preventScroll: true });
  }

  protected setAdding(open: boolean): void {
    if (!open) this.addingTo.set(undefined);
  }
}
