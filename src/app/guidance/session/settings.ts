import { Injectable, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../api/api.service';
import { MemberSettings } from '../api/models';
import { Viewer } from './viewer';

/**
 * The signed-in member's settings (My profile), shared by the pages that read
 * them: the session room asks about AI scribe only when there's no saved answer.
 * Providers have none. Provided on the app's route.
 */
@Injectable()
export class Settings {
  private readonly api = inject(ApiService);
  private readonly viewer = inject(Viewer);

  private readonly memberId = computed(() =>
    this.viewer.role() === 'member' && this.viewer.user.hasValue() ? this.viewer.user.value().id : undefined,
  );
  private readonly settings = rxResource({
    params: () => this.memberId(),
    stream: ({ params }) => this.api.getSettings(params),
  });

  readonly loaded = computed(() => this.settings.hasValue());
  /** Their saved AI scribe answer; undefined means ask before each session. */
  readonly aiScribe = computed(() => (this.settings.hasValue() ? this.settings.value().aiScribe : undefined));

  save(settings: MemberSettings): Observable<MemberSettings> {
    const memberId = this.memberId();
    if (!memberId) throw new Error('only members have settings');
    return this.api.saveSettings(memberId, settings).pipe(tap((saved) => this.settings.set(saved)));
  }
}
