import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, model, output, signal } from '@angular/core';
import { Field, form, maxLength, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent, DialogComponent } from '@compsych-ui-components/angular';
import { ApiService } from '../api/api.service';
import { CheckInFocus, SessionSummary } from '../api/models';

/** What members can choose from, as written on the check-in. */
export const FOCUS_TOPICS = [
  'Stress or burnout',
  'Anxiety or worry',
  'Low mood',
  'Relationships',
  'Sleep',
  'Work or school',
  'Grief or loss',
  'Something else',
];

interface FocusModel {
  /** One per FOCUS_TOPICS entry, so each checkbox binds with `[field]`. */
  topics: boolean[];
  note: string;
}

const NOTE_MAX = 1000;

/**
 * The first step of the pre-session check-in: what the member would like to
 * focus on. Nothing is required. Saving it emits `saved`, and the check-in
 * carries on to its questions.
 */
@Component({
  selector: 'app-focus-dialog',
  imports: [ButtonComponent, DialogComponent, Field],
  templateUrl: './focus-dialog.html',
  styleUrl: './focus-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FocusDialog {
  private readonly api = inject(ApiService);

  readonly open = model(false);
  readonly session = input.required<SessionSummary>();
  readonly saved = output<CheckInFocus>();

  protected readonly topics = FOCUS_TOPICS;
  protected readonly provider = computed(() => this.session().provider.firstName);

  /** Starts from what they chose before, if they've been here already. */
  private readonly model = linkedSignal<FocusModel>(() => {
    const before = this.session().checkInFocus;
    return {
      topics: FOCUS_TOPICS.map((t) => !!before?.topics.includes(t)),
      note: before?.note ?? '',
    };
  });
  protected readonly focus = form(this.model, (path) => {
    maxLength(path.note, NOTE_MAX);
  });
  protected readonly noteMax = NOTE_MAX;

  protected readonly error = signal('');

  protected async save(): Promise<void> {
    this.error.set('');
    await submit(this.focus, async () => {
      const { topics, note } = this.model();
      const focus: CheckInFocus = { topics: FOCUS_TOPICS.filter((_, i) => topics[i]), note: note.trim() };
      try {
        await firstValueFrom(this.api.saveCheckInFocus(this.session().id, focus));
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
}
