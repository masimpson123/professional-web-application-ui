import { ChangeDetectionStrategy, Component, computed, inject, model, output, signal } from '@angular/core';
import { Field, form, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent, DialogComponent } from '@compsych-ui-components/angular';
import { AiScribeConsent as Consent } from '../api/models';
import { SessionStore } from '../session/session.store';
import { Settings } from '../session/settings';
import { Icon } from '../shared/icon';

interface ConsentModel {
  /** '' until they choose. Radios bound with `[field]` read and write strings. */
  aiScribe: '' | Consent;
  /** "Save my preference and do not ask again". */
  remember: boolean;
}

/**
 * Asks the member, as they join, whether their provider may use AI scribe in the
 * session. Their answer is recorded for this session; with "Save my preference"
 * it's also saved to My profile, and they aren't asked again. Either answer
 * joins the call; Cancel doesn't.
 */
@Component({
  selector: 'app-ai-scribe-consent',
  imports: [ButtonComponent, DialogComponent, Field, Icon],
  templateUrl: './ai-scribe-consent.html',
  styleUrl: './ai-scribe-consent.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiScribeConsentDialog {
  protected readonly store = inject(SessionStore);
  private readonly settings = inject(Settings);

  readonly open = model(false);
  /** They answered (and it's saved): join the call. */
  readonly answered = output<Consent>();

  protected readonly provider = computed(() => this.store.provider().firstName);

  private readonly model = signal<ConsentModel>({ aiScribe: '', remember: false });
  protected readonly consent = form(this.model, (path) => {
    required(path.aiScribe);
  });

  protected readonly error = signal('');
  protected readonly missingChoice = computed(
    () => this.consent.aiScribe().touched() && this.consent.aiScribe().invalid(),
  );

  protected async join(): Promise<void> {
    this.error.set('');
    await submit(this.consent, async () => {
      const { aiScribe, remember } = this.model();
      const answer = aiScribe as Consent;
      try {
        await firstValueFrom(this.store.setAiScribe(answer));
        if (remember) await firstValueFrom(this.settings.save({ aiScribe: answer }));
      } catch {
        this.error.set('We couldn’t save your answer. Check your internet connection, then try again.');
        return undefined;
      }
      this.open.set(false);
      this.answered.emit(answer);
      return undefined;
    });
  }

  protected cancel(): void {
    this.open.set(false);
  }
}
