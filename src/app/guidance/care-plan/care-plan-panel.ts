import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BadgeComponent, ButtonComponent } from '@compsych-ui-components/angular';
import { SessionStore } from '../session/session.store';
import { AddToCarePlan } from './add-to-care-plan';
import { CarePlanList } from './care-plan-list';
import { ProviderNote } from './provider-note';

/**
 * The member's care plan, beside the call in the session room. The member works
 * through it and ticks items off; the provider sees their progress, adds to it
 * from the ComPsych resource library (or uploads from their computer), and
 * takes items out.
 */
@Component({
  selector: 'app-care-plan-panel',
  imports: [AddToCarePlan, BadgeComponent, ButtonComponent, CarePlanList, ProviderNote],
  templateUrl: './care-plan-panel.html',
  styleUrl: './care-plan-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarePlanPanel {
  protected readonly store = inject(SessionStore);
  /** The resource library search is open. */
  protected readonly adding = signal(false);
}
