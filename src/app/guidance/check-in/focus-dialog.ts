import { ChangeDetectionStrategy, Component, inject, input, linkedSignal, model, output, signal } from '@angular/core';
import { form, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent, DialogComponent } from '@compsych-ui-components/angular';
import { ApiService } from '../api/api.service';
import { CheckInFocus } from '../api/models';
import { FocusFields, focusSchema, fromFocusModel, toFocusModel } from './focus-fields';

/**
 * Edits what the member would like to focus on, which they first chose when
 * booking. Offered before they go into the session, so it reflects how they feel
 * on the day. Nothing is required.
 */
@Component({
  selector: 'app-focus-dialog',
  imports: [ButtonComponent, DialogComponent, FocusFields],
  templateUrl: './focus-dialog.html',
  styleUrl: './focus-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FocusDialog {
  private readonly api = inject(ApiService);

  readonly open = model(false);
  readonly sessionId = input.required<string>();
  /** The provider's first name, for "Maya will see this before your session." */
  readonly provider = input.required<string>();
  /** What they chose before, which the form starts from. */
  readonly focus = input<CheckInFocus>();
  readonly saved = output<CheckInFocus>();

  private readonly model = linkedSignal(() => toFocusModel(this.focus()));
  protected readonly fields = form(this.model, focusSchema);

  protected readonly error = signal('');

  protected async save(): Promise<void> {
    this.error.set('');
    await submit(this.fields, async () => {
      const focus = fromFocusModel(this.model());
      try {
        await firstValueFrom(this.api.saveCheckInFocus(this.sessionId(), focus));
      } catch {
        this.error.set('We couldn’t save that. Check your internet connection, then try again.');
        return undefined;
      }
      // Before closing: whoever opened it may let go of the session once it closes.
      this.saved.emit(focus);
      this.open.set(false);
      return undefined;
    });
  }

  protected cancel(): void {
    this.model.set(toFocusModel(this.focus())); // start from what's saved next time
    this.open.set(false);
  }
}
