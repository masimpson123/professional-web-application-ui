import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { BadgeComponent, ButtonComponent, TextInputComponent } from '@compsych-ui-components/angular';
import { DocRow } from '../documents/doc-row';
import { SessionStore } from '../session/session.store';

/**
 * A session that has already happened: the provider's notes, the AI summary of
 * the call, and what was shared. There's no call to join, so no video. The provider
 * can write and edit their notes here; the member can only read them.
 */
@Component({
  selector: 'app-past-session-view',
  imports: [BadgeComponent, ButtonComponent, DocRow, TextInputComponent],
  templateUrl: './past-session-view.html',
  styleUrl: './past-session-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PastSessionView {
  protected readonly store = inject(SessionStore);
  private readonly injector = inject(Injector);

  private readonly overviewField = viewChild<ElementRef<HTMLTextAreaElement>>('overviewField');
  private readonly editButton = viewChild('editButton', { read: ElementRef });

  protected readonly recapTitle = computed(() =>
    this.store.isProvider() ? 'Your notes' : `${this.store.provider().firstName}’s notes`,
  );

  protected readonly noRecap = computed(() =>
    this.store.isProvider()
      ? 'You haven’t written notes for this session yet.'
      : `${this.store.provider().firstName} hasn’t added notes for this session yet.`,
  );

  // ---- Editing (provider only) ---------------------------------------------

  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');
  protected readonly draftOverview = signal('');
  protected readonly draftSteps = signal<string[]>([]);
  protected readonly canSave = computed(
    () =>
      !this.saving() &&
      (!!this.draftOverview().trim() || this.draftSteps().some((step) => step.trim())),
  );

  protected edit(): void {
    if (!this.store.isProvider()) return;
    const recap = this.store.recap();
    this.draftOverview.set(recap?.overview ?? '');
    this.draftSteps.set(recap?.nextSteps.length ? [...recap.nextSteps] : ['']);
    this.saveError.set('');
    this.editing.set(true);
    this.focusAfterRender(() => this.overviewField()?.nativeElement);
  }

  protected cancel(): void {
    this.stopEditing();
  }

  protected setStep(index: number, value: string): void {
    this.draftSteps.update((steps) => steps.map((step, i) => (i === index ? value : step)));
  }

  protected addStep(): void {
    this.draftSteps.update((steps) => [...steps, '']);
  }

  protected removeStep(index: number): void {
    this.draftSteps.update((steps) => steps.filter((_, i) => i !== index));
  }

  protected save(): void {
    if (!this.canSave()) return;
    this.saving.set(true);
    this.saveError.set('');
    this.store
      .saveRecap({
        overview: this.draftOverview().trim(),
        nextSteps: this.draftSteps()
          .map((step) => step.trim())
          .filter(Boolean),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.stopEditing();
        },
        error: () => {
          this.saving.set(false);
          this.saveError.set('Couldn’t save your notes. Try again.');
        },
      });
  }

  /** Leaves the editor and puts focus back on the button that opened it. */
  private stopEditing(): void {
    this.editing.set(false);
    this.focusAfterRender(() => this.editButton()?.nativeElement.querySelector('button'));
  }

  private focusAfterRender(target: () => HTMLElement | null | undefined): void {
    afterNextRender(() => target()?.focus(), { injector: this.injector });
  }
}
