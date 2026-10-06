import { DatePipe, LowerCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ButtonComponent, DialogComponent } from '@compsych-ui-components/angular';
import { ApiService } from '../api/api.service';
import { DIFFICULTY, FREQUENCIES, GAD7, PHQ9, score } from '../check-in/questionnaires';
import { SessionStore } from '../session/session.store';

/**
 * Providers: the member's new member check-in, the PHQ-9 and GAD-7 they did
 * once when they started, as scores with a way to read every answer. In the
 * room's header, where members see their pre-session check-in, so it's there
 * before and during the session. Only the provider sees it.
 */
@Component({
  selector: 'app-member-check-in',
  imports: [ButtonComponent, DatePipe, DialogComponent, LowerCasePipe],
  templateUrl: './member-check-in.html',
  styleUrl: './member-check-in.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberCheckIn {
  private readonly api = inject(ApiService);
  protected readonly store = inject(SessionStore);

  protected readonly checkIn = rxResource({
    params: () => this.store.member().id,
    stream: ({ params }) => this.api.getNewMemberCheckInAnswers(params),
  });

  /** What the header line says: loading, not done (a 404), failed, or the scores. */
  protected readonly view = computed(() => {
    const error = this.checkIn.error();
    if (error) return (error as HttpErrorResponse).status === 404 ? 'not-done' : 'failed';
    return this.checkIn.hasValue() ? 'done' : 'loading';
  });

  /** Each questionnaire with its score and the member's answer to every question. */
  protected readonly results = computed(() => {
    if (!this.checkIn.hasValue()) return [];
    const answers = this.checkIn.value();
    return [PHQ9, GAD7].map((q) => ({
      ...q,
      score: score(q, answers[q.id]),
      answers: q.items.map((text, i) => ({ text, answer: FREQUENCIES[answers[q.id][i]].label })),
    }));
  });

  /** The answer to how hard these problems have made things, if they were asked it. */
  protected readonly difficulty = computed(() => {
    const value = this.checkIn.hasValue() ? this.checkIn.value().difficulty : undefined;
    return value === undefined ? undefined : DIFFICULTY.options[value].label;
  });

  protected readonly difficultyQuestion = DIFFICULTY.question;
  protected readonly reading = signal(false);
}
