import { NgTemplateOutlet, formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { Field, applyEach, form, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { ButtonComponent, CardComponent } from '@compsych-ui-components/angular';
import { ApiService } from '../api/api.service';
import { Frequency, PHQ9_SELF_HARM, personLabel, sessionPhase } from '../api/models';
import { PageCrumbs } from '../page-crumbs';
import { GUIDANCE_HOME, GUIDANCE_SESSIONS } from '../paths';
import { Viewer } from '../session/viewer';
import { Icon } from '../shared/icon';
import { DIFFICULTY, FREQUENCIES, GAD7, PHQ9 } from './questionnaires';

/**
 * The form's model. Radio buttons bound with `[field]` read and write their
 * `value` attribute, which is always a string, so each answer is '0' to '3', or
 * '' while unanswered. They become numbers when the check-in is sent.
 */
interface CheckInModel {
  phq9: string[];
  gad7: string[];
  difficulty: string;
}

/** Whether any answer reports a problem, so the closing "how difficult" question applies. */
const reportsProblem = (answers: string[]) => answers.some((a) => a !== '' && a !== '0');

/** A plausible set of answers, for the demo's "fill in" shortcut. Question 9 is "Not at all". */
const SAMPLE_ANSWERS: CheckInModel = {
  phq9: ['1', '1', '2', '2', '0', '1', '1', '0', '0'],
  gad7: ['1', '2', '2', '1', '0', '1', '1'],
  difficulty: '1',
};

/**
 * The member's pre-session check-in: the PHQ-9 and GAD-7, sent to their provider
 * before the session so it can start with what matters. Built on signal forms:
 * every question is required, and the closing one only once a problem is
 * reported. Members don't see scores; an answer about self-harm brings up crisis
 * resources straight away.
 */
@Component({
  selector: 'app-check-in-page',
  imports: [ButtonComponent, CardComponent, Field, Icon, NgTemplateOutlet, RouterLink],
  templateUrl: './check-in-page.html',
  styleUrl: './check-in-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckInPage {
  protected readonly homeUrl = GUIDANCE_HOME;
  protected readonly questionnaires = [PHQ9, GAD7];
  protected readonly frequencies = FREQUENCIES;
  protected readonly difficulty = DIFFICULTY;
  protected readonly selfHarmIndex = PHQ9_SELF_HARM;

  private readonly api = inject(ApiService);
  private readonly viewer = inject(Viewer);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Mock-up only: the shortcut that fills in the form. */
  protected readonly demo = this.api.demo;

  /** The session id, from `/sessions/:id/check-in` (the portfolio has no input binding). */
  private readonly id = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('id') ?? '')),
    { requireSync: true },
  );

  private readonly detail = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.api.getSession(params),
  });

  // ---- The form ----------------------------------------------------------------

  private readonly model = signal<CheckInModel>({
    phq9: PHQ9.items.map(() => ''),
    gad7: GAD7.items.map(() => ''),
    difficulty: '',
  });

  protected readonly checkIn = form(this.model, (path) => {
    applyEach(path.phq9, (answer) => required(answer));
    applyEach(path.gad7, (answer) => required(answer));
    required(path.difficulty, {
      when: ({ valueOf }) => reportsProblem([...valueOf(path.phq9), ...valueOf(path.gad7)]),
    });
  });

  protected readonly anyProblem = computed(() =>
    reportsProblem([...this.model().phq9, ...this.model().gad7]),
  );
  protected readonly selfHarm = computed(() => reportsProblem([this.model().phq9[PHQ9_SELF_HARM]]));

  protected readonly total = computed(() => PHQ9.items.length + GAD7.items.length + (this.anyProblem() ? 1 : 0));
  /** Every unanswered question is one `required` error. */
  protected readonly unanswered = computed(() => this.checkIn().errorSummary().length);

  /** Why the last send didn't go through, if it didn't. */
  private readonly sendError = signal('');
  protected readonly error = computed(() => {
    const left = this.unanswered();
    if (left && this.checkIn().touched()) {
      return `Answer every question to finish. ${left === 1 ? '1 is' : `${left} are`} left.`;
    }
    return this.sendError();
  });

  /** Sent in this visit, so the page thanks them rather than saying it's already done. */
  protected readonly submitted = signal(false);

  // ---- What the page shows -----------------------------------------------------

  protected readonly view = computed(() => {
    const error = this.detail.error() ?? this.viewer.user.error();
    if (error) return (error as { status?: number }).status === 404 ? 'missing' : 'failed';
    if (!this.detail.hasValue() || !this.viewer.user.hasValue()) return 'loading';
    const { session, member, checkIn } = this.detail.value();
    // Only the member checks in; the demo API serves any session, so that's checked here.
    if (this.viewer.user.value().id !== member.id) return 'missing';
    if (this.submitted()) return 'thanks';
    if (checkIn) return 'done';
    return sessionPhase(session) === 'upcoming' ? 'form' : 'closed';
  });

  protected readonly provider = computed(() => this.detail.value()!.provider);
  protected readonly providerLabel = computed(() => personLabel(this.provider()));
  protected readonly firstName = computed(() =>
    this.viewer.user.hasValue() ? this.viewer.user.value().firstName : '',
  );
  /** "Monday, October 12 at 12:30 PM" */
  protected readonly when = computed(() => {
    const start = this.detail.value()!.session.start;
    return `${formatDate(start, 'EEEE, MMMM d', 'en-US')} at ${formatDate(start, 'h:mm a', 'en-US')}`;
  });

  constructor() {
    const crumbs = inject(PageCrumbs);
    effect(() => {
      const detail = this.detail.hasValue() ? this.detail.value() : undefined;
      untracked(() =>
        crumbs.trail.set([
          { id: GUIDANCE_SESSIONS, label: 'Sessions', kind: 'link' },
          ...(detail
            ? [{ id: `${GUIDANCE_SESSIONS}/${detail.session.id}`, label: `Session ${detail.session.number}`, kind: 'link' as const }]
            : []),
          { id: 'current', label: 'Pre-session check-in', kind: 'current' },
        ]),
      );
    });
  }

  /** Mock-up only: answers every question, so the demo can get to the end quickly. */
  protected fillInSample(): void {
    if (!this.demo) return;
    this.model.set(structuredClone(SAMPLE_ANSWERS));
    this.sendError.set('');
  }

  protected async send(): Promise<void> {
    this.sendError.set('');
    await submit(this.checkIn, async () => {
      const { phq9, gad7, difficulty } = this.model();
      const score = (answer: string) => Number(answer) as Frequency;
      try {
        await firstValueFrom(
          this.api.submitCheckIn(this.id(), {
            phq9: phq9.map(score),
            gad7: gad7.map(score),
            difficulty: this.anyProblem() ? score(difficulty) : undefined,
          }),
        );
        this.submitted.set(true);
        this.host.nativeElement.scrollTop = 0; // the page scrolls inside itself
        afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('#check-in-thanks')?.focus(), {
          injector: this.injector,
        });
      } catch {
        this.sendError.set('We couldn’t send your check-in. Check your internet connection, then try again.');
      }
      return undefined;
    });
    // `submit` skips the send while anything's unanswered: take them to the first gap.
    if (this.checkIn().invalid()) {
      this.host.nativeElement.querySelector<HTMLInputElement>('fieldset[data-unanswered] input')?.focus();
    }
  }

  protected retry(): void {
    if (this.viewer.user.error()) this.viewer.user.reload();
    this.detail.reload();
  }
}
