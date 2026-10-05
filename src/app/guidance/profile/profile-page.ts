import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ButtonComponent, CardComponent } from '@compsych-ui-components/angular';
import { MemberSettings } from '../api/models';
import { PageCrumbs } from '../page-crumbs';
import { Settings } from '../session/settings';
import { Viewer } from '../session/viewer';

/**
 * My profile: who's signed in and, for members, their settings. The AI scribe
 * setting appears once they've saved a preference when joining a session
 * ("Save my preference and do not ask again"); until then they're asked each time.
 */
@Component({
  selector: 'app-profile-page',
  imports: [ButtonComponent, CardComponent],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  protected readonly viewer = inject(Viewer);
  protected readonly settings = inject(Settings);

  protected readonly isMember = computed(() => this.viewer.role() === 'member');
  protected readonly user = computed(() => (this.viewer.user.hasValue() ? this.viewer.user.value() : undefined));

  protected readonly saving = signal(false);
  protected readonly error = signal('');
  /** Latest change, read out by a polite live region. */
  protected readonly announcement = signal('');

  constructor() {
    inject(PageCrumbs).trail.set([{ id: 'current', label: 'My profile', kind: 'current' }]);
  }

  protected setAiScribe(allowed: boolean): void {
    this.save({ aiScribe: allowed ? 'allowed' : 'declined' }, allowed ? 'AI notes allowed in your sessions.' : 'AI notes turned off for your sessions.');
  }

  /** Back to being asked before each session; the setting goes until they save one again. */
  protected askEachTime(): void {
    this.save({}, 'You’ll be asked before each session.');
  }

  private save(settings: MemberSettings, done: string): void {
    this.saving.set(true);
    this.error.set('');
    this.settings.save(settings).subscribe({
      next: () => {
        this.saving.set(false);
        this.announcement.set(done);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('We couldn’t save that change. Check your internet connection, then try again.');
      },
    });
  }
}
