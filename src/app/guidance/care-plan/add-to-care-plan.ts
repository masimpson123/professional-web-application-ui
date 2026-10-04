import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  ButtonComponent,
  CardComponent,
  DialogComponent,
  TextInputComponent,
} from '@compsych-ui-components/angular';
import {
  Observable,
  Subject,
  catchError,
  concat,
  debounceTime,
  distinctUntilChanged,
  exhaustMap,
  map,
  of,
  scan,
  startWith,
  switchMap,
  EMPTY,
} from 'rxjs';
import { ApiService } from '../api/api.service';
import { CarePlanItem, Resource } from '../api/models';
import { KIND_ICON, KIND_LABEL } from '../documents/doc-kinds';

interface Results {
  items: Resource[];
  total: number;
  loading: boolean;
  failed: boolean;
  done: boolean;
}

const NO_RESULTS: Results = { items: [], total: 0, loading: true, failed: false, done: false };

/**
 * The provider's way to add to a member's care plan: search the ComPsych resource
 * library, pick one or more resources, and add them together. Uploading from the
 * computer is the secondary way in, from the same dialog.
 */
@Component({
  selector: 'app-add-to-care-plan',
  imports: [ButtonComponent, CardComponent, DialogComponent, TextInputComponent],
  templateUrl: './add-to-care-plan.html',
  styleUrl: './add-to-care-plan.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddToCarePlan {
  private readonly api = inject(ApiService);

  readonly open = model(false);
  /** Whose plan, e.g. "Jordan". */
  readonly memberName = input.required<string>();
  /** What's in the plan already, so it can't be added twice. */
  readonly items = input<CarePlanItem[]>([]);

  /** Library resources to add. */
  readonly add = output<string[]>();
  /** Files from the provider's computer to upload instead. */
  readonly upload = output<File[]>();

  protected readonly kindIcon = KIND_ICON;
  protected readonly kindLabel = KIND_LABEL;
  protected readonly query = signal('');
  protected readonly selected = signal<ReadonlySet<string>>(new Set());

  private readonly more$ = new Subject<void>();
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  /**
   * Results for the latest query, a server page at a time. Typing is debounced,
   * and a new query cancels the old one's requests (`switchMap`).
   */
  protected readonly results = toSignal(
    toObservable(this.query).pipe(
      map((q) => q.trim()),
      debounceTime(250),
      distinctUntilChanged(),
      switchMap((q) => this.pages(q)),
    ),
    { initialValue: NO_RESULTS },
  );

  protected readonly heading = computed(() => {
    const q = this.query().trim();
    const { total, loading } = this.results();
    if (!q) return 'Most recent';
    if (loading && !total) return 'Searching…';
    return `${total} ${total === 1 ? 'result' : 'results'} for “${q}”`;
  });

  protected readonly addLabel = computed(() => {
    const count = this.selected().size;
    return count > 1 ? `Add ${count} to care plan` : 'Add to care plan';
  });

  protected inPlan(resource: Resource): boolean {
    return this.items().some((i) => i.id === `plan-${resource.id}` || i.title === resource.title);
  }

  protected toggle(resource: Resource): void {
    if (this.inPlan(resource)) return;
    this.selected.update((current) => {
      const next = new Set(current);
      if (next.has(resource.id)) next.delete(resource.id);
      else next.add(resource.id);
      return next;
    });
  }

  protected loadMore(): void {
    this.more$.next();
  }

  protected confirm(): void {
    const ids = [...this.selected()];
    if (ids.length) this.add.emit(ids);
    this.close();
  }

  protected chooseFiles(): void {
    this.fileInput().nativeElement.click();
  }

  protected onFilesChosen(input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) return;
    this.upload.emit(files);
    this.close();
  }

  /** Closes and starts fresh next time. */
  protected close(): void {
    this.open.set(false);
    this.selected.set(new Set());
    this.query.set('');
  }

  private pages(query: string): Observable<Results> {
    let cursor: string | undefined;
    let done = false;
    type Step = { page: { items: Resource[]; total: number } } | { failed: true } | { loading: true };
    return this.more$.pipe(
      startWith(undefined),
      exhaustMap(() =>
        done
          ? EMPTY
          : concat(
              of<Step>({ loading: true }),
              this.api.searchResources({ query, cursor }).pipe(
                map((page): Step => {
                  cursor = page.nextCursor;
                  done = !page.nextCursor;
                  return { page };
                }),
                catchError(() => of<Step>({ failed: true })),
              ),
            ),
      ),
      scan(
        (results, step): Results =>
          'page' in step
            ? { items: [...results.items, ...step.page.items], total: step.page.total, loading: false, failed: false, done }
            : 'failed' in step
              ? { ...results, loading: false, failed: true }
              : { ...results, loading: true, failed: false },
        NO_RESULTS,
      ),
    );
  }
}
