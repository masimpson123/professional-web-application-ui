import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Field, FieldTree, maxLength, schema } from '@angular/forms/signals';
import { CheckInFocus } from '../api/models';

/** What members can choose from, as written on the focus form. */
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

export const FOCUS_NOTE_MAX = 1000;

/** The focus form's model: one checkbox per topic, so each binds with `[field]`, and a note. */
export interface FocusModel {
  topics: boolean[];
  note: string;
}

export const focusSchema = schema<FocusModel>((path) => {
  maxLength(path.note, FOCUS_NOTE_MAX);
});

export function toFocusModel(focus?: CheckInFocus): FocusModel {
  return { topics: FOCUS_TOPICS.map((t) => !!focus?.topics.includes(t)), note: focus?.note ?? '' };
}

export function fromFocusModel({ topics, note }: FocusModel): CheckInFocus {
  return { topics: FOCUS_TOPICS.filter((_, i) => topics[i]), note: note.trim() };
}

/** "Sleep, Anxiety or worry", for showing what they chose; empty if they chose nothing. */
export function focusSummary(focus?: CheckInFocus): string {
  return focus?.topics.join(', ') ?? '';
}

/**
 * What the member would like to focus on: topic chips and a note. Shared by
 * booking a session and editing the focus before it starts. Nothing is required.
 */
@Component({
  selector: 'app-focus-fields',
  imports: [Field],
  template: `
    <fieldset class="topics">
      <legend class="label">Choose any that apply</legend>
      <div class="topics__list">
        @for (topic of topics; track topic; let i = $index) {
          <label class="topic">
            <input type="checkbox" [field]="field().topics[i]" />
            <span>{{ topic }}</span>
          </label>
        }
      </div>
    </fieldset>

    <label class="label" [for]="noteId()">Anything else you want to talk about</label>
    <textarea [id]="noteId()" class="note" rows="4" [field]="field().note"></textarea>
    @if (field().note().invalid()) {
      <p class="error" role="alert">Keep it to {{ noteMax }} characters, or bring the rest to your session.</p>
    }
  `,
  styleUrl: './focus-fields.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FocusFields {
  readonly field = input.required<FieldTree<FocusModel>>();
  /** Keeps the note's id unique when more than one form is on the page. */
  readonly idPrefix = input('focus');

  protected readonly topics = FOCUS_TOPICS;
  protected readonly noteMax = FOCUS_NOTE_MAX;
  protected readonly noteId = () => `${this.idPrefix()}-note`;
}
