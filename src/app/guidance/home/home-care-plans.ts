import { Injectable, computed, inject, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ApiService } from '../api/api.service';
import { CarePlan, CarePlanItem } from '../api/models';
import { DONE_WORDS } from '../documents/doc-kinds';
import { addedMessage } from '../session/session.store';
import { Viewer } from '../session/viewer';

/**
 * The viewer's care plans, for the home page: shared by the care plan section,
 * which edits them, and the member's welcome banner, which sums them up.
 * Provided by the home page.
 */
@Injectable()
export class HomeCarePlans {
  private readonly api = inject(ApiService);
  private readonly viewer = inject(Viewer);

  private readonly loaded = rxResource({
    params: () => (this.viewer.user.hasValue() ? this.viewer.user.value().id : undefined),
    stream: ({ params }) => this.api.getCarePlans(params),
  });
  /** What's on screen: the loaded plans, plus changes made here. Resets when plans reload. */
  readonly plans = linkedSignal(() => (this.loaded.hasValue() ? this.loaded.value() : []));

  readonly view = computed(() => {
    if (this.viewer.user.error() || this.loaded.error()) return 'failed';
    return this.loaded.hasValue() ? 'ready' : 'loading';
  });

  /** Latest change, read out by a polite live region. */
  readonly announcement = signal('');

  /** Member action: tick an item off, saved right away. */
  setDone(plan: CarePlan, { id, done }: { id: string; done: boolean }): void {
    const item = plan.items.find((i) => i.id === id);
    if (!item) return;
    const set = (value: boolean) =>
      this.updatePlan(plan.member.id, (items) =>
        items.map((i) => (i.id === id ? { ...i, done: value } : i)),
      );
    set(done);
    this.api.updateCarePlanItem(plan.member.id, id, { done }).subscribe({
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

  /** Provider action: take an item out of a member's care plan, saved right away. */
  remove(plan: CarePlan, item: CarePlanItem): void {
    const before = plan.items;
    this.updatePlan(plan.member.id, (items) => items.filter((i) => i.id !== item.id));
    this.api.removeFromCarePlan(plan.member.id, item.id).subscribe({
      next: () =>
        this.announcement.set(`Removed from ${plan.member.firstName}’s care plan: ${item.title}`),
      error: () => {
        this.updatePlan(plan.member.id, () => before);
        this.announcement.set(`Couldn’t remove ${item.title}. Try again.`);
      },
    });
  }

  /** Provider action: add resources from the ComPsych library to a member's care plan. */
  addResources(plan: CarePlan, resourceIds: string[]): void {
    if (!resourceIds.length) return;
    this.api.addResourcesToCarePlan(plan.member.id, resourceIds).subscribe({
      next: (items) => {
        this.updatePlan(plan.member.id, (current) => [...current, ...items]);
        this.announcement.set(addedMessage(plan.member.firstName, items));
      },
      error: () => this.announcement.set('Couldn’t add those resources. Try again.'),
    });
  }

  /** Provider action: upload documents into a member's care plan. */
  upload(plan: CarePlan, files: File[]): void {
    if (!files.length) return;
    this.api.uploadToCarePlan(plan.member.id, files).subscribe({
      next: ({ items }) => {
        this.updatePlan(plan.member.id, (current) => [...current, ...items]);
        this.announcement.set(addedMessage(plan.member.firstName, items));
      },
      error: () => this.announcement.set('Couldn’t upload those documents. Try again.'),
    });
  }

  /** Fetches the plans again, e.g. after booking moves the next session. */
  reload(): void {
    this.loaded.reload();
  }

  retry(): void {
    if (this.viewer.user.error()) this.viewer.user.reload();
    else this.loaded.reload();
  }

  private updatePlan(memberId: string, change: (items: CarePlanItem[]) => CarePlanItem[]): void {
    this.plans.update((plans) =>
      plans.map((p) => (p.member.id === memberId ? { ...p, items: change(p.items) } : p)),
    );
  }
}

/** How much of a plan is done. */
export function planProgress(plan: CarePlan): { done: number; total: number } {
  return { done: plan.items.filter((item) => item.done).length, total: plan.items.length };
}
