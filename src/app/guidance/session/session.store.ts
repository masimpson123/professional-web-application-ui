import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap, throwError } from 'rxjs';
import { ApiService } from '../api/api.service';
import { CarePlanItem, SessionDetail, SessionRecap } from '../api/models';
import { DONE_WORDS } from '../documents/doc-kinds';
import { Viewer } from './viewer';

/**
 * State for one session room, shared by the video stage and the care plan panel.
 * The room page provides it and calls `open()` once the session has loaded; the
 * stage and panel only render after that.
 */
@Injectable()
export class SessionStore {
  private readonly api = inject(ApiService);
  private readonly detail = signal<SessionDetail | undefined>(undefined);

  /** Whose side of the room we're on. */
  readonly role = inject(Viewer).role.asReadonly();
  readonly isProvider = computed(() => this.role() === 'provider');
  readonly loaded = computed(() => !!this.detail());

  readonly session = computed(() => this.require().session);
  readonly provider = computed(() => this.require().provider);
  readonly member = computed(() => this.require().member);
  private readonly savedRecap = signal<SessionRecap | undefined>(undefined);
  /** The provider's notes on what happened, once written. Members can only read them. */
  readonly recap = this.savedRecap.asReadonly();
  /** What was said in the call, summarized by AI once it has ended. */
  readonly aiSummary = computed(() => this.require().aiSummary);
  /** ISO date of the next booked session, when the care plan is due; undefined if none is booked. */
  readonly nextSession = computed(() => this.require().nextSession);

  readonly me = computed(() => (this.isProvider() ? this.provider() : this.member()));
  readonly them = computed(() => (this.isProvider() ? this.member() : this.provider()));

  /** What the provider shared in the session; shown once it's over. */
  readonly shared = computed(() => this.require().shared);

  /** What the member is expected to work through before their next session. */
  readonly carePlan = signal<CarePlanItem[]>([]);

  readonly openCount = computed(() => this.carePlan().filter((item) => !item.done).length);

  /** Latest change, read out by a polite live region. */
  readonly announcement = signal('');

  open(detail: SessionDetail): void {
    this.detail.set(detail);
    this.carePlan.set(detail.carePlan);
    this.savedRecap.set(detail.recap);
    this.announcement.set('');
  }

  /** Provider action: save their notes on this session. Errors are left to the caller to show. */
  saveRecap(recap: SessionRecap): Observable<SessionRecap> {
    if (!this.isProvider()) return throwError(() => new Error('only the provider can edit notes'));
    return this.api.saveRecap(this.session().id, recap).pipe(
      tap((saved) => {
        this.savedRecap.set(saved);
        this.announcement.set('Your notes are saved.');
      }),
    );
  }

  /** Member action: tick an item off their care plan, or untick it. Saved right away. */
  setDone(id: string, done: boolean): void {
    const item = this.carePlan().find((t) => t.id === id);
    if (!item) return;
    const set = (value: boolean) =>
      this.carePlan.update((list) => list.map((t) => (t.id === id ? { ...t, done: value } : t)));
    set(done);
    this.api.updateCarePlanItem(this.member().id, id, { done }).subscribe({
      next: () => {
        const verb = DONE_WORDS[item.kind].past;
        this.announcement.set(
          done ? `Marked as ${verb}: ${item.title}` : `Moved back into your care plan: ${item.title}`,
        );
      },
      error: () => {
        set(!done);
        this.announcement.set(`Couldn’t save that change to ${item.title}. Try again.`);
      },
    });
  }

  /** Provider action: take an item out of the member's care plan. Saved right away. */
  remove(item: CarePlanItem): void {
    if (!this.isProvider()) return;
    const before = this.carePlan();
    this.carePlan.set(before.filter((i) => i.id !== item.id));
    this.api.removeFromCarePlan(this.member().id, item.id).subscribe({
      next: () =>
        this.announcement.set(`Removed from ${this.member().firstName}’s care plan: ${item.title}`),
      error: () => {
        this.carePlan.set(before);
        this.announcement.set(`Couldn’t remove ${item.title}. Try again.`);
      },
    });
  }

  /** Provider action: add resources from the ComPsych library to the member's care plan. */
  addResources(resourceIds: string[]): void {
    if (!this.isProvider() || !resourceIds.length) return;
    this.api.addResourcesToCarePlan(this.member().id, resourceIds).subscribe({
      next: (items) => {
        this.carePlan.update((plan) => [...plan, ...items]);
        this.announcement.set(addedMessage(this.member().firstName, items));
      },
      error: () => this.announcement.set('Couldn’t add those resources. Try again.'),
    });
  }

  /**
   * Provider action: upload documents for the member. They go straight into the
   * member's care plan (and are recorded as shared in this session). Members
   * can't upload.
   */
  upload(files: FileList | File[]): void {
    const list = Array.from(files);
    if (!this.isProvider() || !list.length) return;
    this.api.uploadToCarePlan(this.member().id, list, this.session().id).subscribe({
      next: ({ items }) => {
        this.carePlan.update((plan) => [...plan, ...items]);
        this.announcement.set(addedMessage(this.member().firstName, items));
      },
      error: () => this.announcement.set('Couldn’t upload those documents. Try again.'),
    });
  }

  private require(): SessionDetail {
    const detail = this.detail();
    if (!detail) throw new Error('SessionStore was read before open()');
    return detail;
  }
}

/** "Added to Jordan’s care plan: Weekly sleep log", or a count for several. */
export function addedMessage(memberName: string, items: CarePlanItem[]): string {
  const what = items.length === 1 ? items[0].title : `${items.length} documents`;
  return items.length
    ? `Added to ${memberName}’s care plan: ${what}`
    : `Those are already in ${memberName}’s care plan.`;
}
