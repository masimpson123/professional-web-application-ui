/**
 * Keeps a video container showing exactly the stream the session state says it
 * should.
 *
 * Attaching a Zoom stream is async: `attachVideo()` resolves with a
 * `<video-player>` some time later, or fails. Meanwhile the target can change.
 * The other person might switch to a newer copy, turn their camera off, or leave.
 * Done by hand this needs bookkeeping ("what's attached? is an attach still
 * running? is its result still wanted?"), and that bookkeeping is where the
 * earlier rendering bugs came from.
 *
 * RxJS's `switchMap` covers exactly this. Each new target starts a fresh render
 * and cancels the one in flight. A cancelled render that finishes late cleans up
 * after itself instead of showing a stale stream.
 */

import {
  EMPTY,
  Observable,
  ReplaySubject,
  catchError,
  defer,
  distinctUntilChanged,
  map,
  merge,
  mergeMap,
  retry,
  share,
  switchMap,
  takeWhile,
  tap,
} from 'rxjs';

/** How to show and hide one kind of stream (camera or shared screen). */
export interface StreamOps {
  /** Resolves with the element to show, or with anything else (Zoom's failure object) on failure. */
  attach(userId: number): Promise<unknown>;
  /** Stops rendering `element` for `userId`. Must tolerate the session having ended. */
  detach(userId: number, element: HTMLElement): Promise<unknown>;
}

export interface RenderOptions {
  /** Used in log messages. */
  name: string;
  /** Where the element goes. Looked up per render because views mount after the call is created. */
  container: () => HTMLElement | undefined;
  ops: StreamOps;
  /** Attempts per target before giving up. Attaching just after joining can fail transiently. */
  attempts?: number;
  retryDelayMs?: number;
}

/**
 * Renders the latest user id from `target$` into the container (null = show nothing).
 *
 * The returned observable never errors: a target that can't be rendered after
 * `attempts` tries is logged and skipped, and the next target still renders.
 * Subscribe once for the life of the call.
 */
export function renderStream(
  target$: Observable<number | null>,
  options: RenderOptions,
): Observable<void> {
  const { name, container, ops, attempts = 3, retryDelayMs = 1000 } = options;

  /** What this container currently shows. */
  let shown: { userId: number; element: HTMLElement } | undefined;

  /** Removes whatever is shown. Detach errors are ignored: we want it gone either way. */
  const clear = async () => {
    if (!shown) return;
    const { userId, element } = shown;
    shown = undefined;
    element.remove();
    await ops.detach(userId, element).catch(() => undefined);
  };

  /** One render of one target, cancelled by unsubscribing (which switchMap does). */
  const render = (userId: number | null) =>
    new Observable<void>((subscriber) => {
      let cancelled = false;

      (async () => {
        await clear();
        if (userId === null || cancelled) return;

        const host = container();
        if (!host) throw new Error('container is not mounted');
        const element = await ops.attach(userId);
        if (!(element instanceof HTMLElement)) {
          throw new Error(`attach returned no element: ${JSON.stringify(element)}`);
        }
        if (cancelled) {
          // Superseded while attaching: undo just this element, so a newer
          // render of the same user keeps its own.
          await ops.detach(userId, element).catch(() => undefined);
          return;
        }
        host.append(element);
        shown = { userId, element };
      })().then(
        () => subscriber.complete(),
        (err) => subscriber.error(err),
      );

      return () => {
        cancelled = true;
      };
    }).pipe(
      // Re-run the whole render (clear, then attach) a few times before giving up.
      retry({ count: attempts - 1, delay: retryDelayMs }),
      catchError((err) => {
        console.warn(`[zoom] couldn't render ${name} for user ${userId}`, err);
        return EMPTY;
      }),
    );

  return target$.pipe(
    distinctUntilChanged(),
    tap((userId) => console.debug(`[zoom] ${name} → ${userId ?? 'nothing'}`)),
    // A new target cancels the render in flight; that is the point of this file.
    switchMap(render),
  );
}

export interface RenderEachOptions extends Omit<RenderOptions, 'container'> {
  /** Where each user's element goes, e.g. their tile in the gallery. */
  container: (userId: number) => HTMLElement | undefined;
}

/**
 * Renders a stream for every user id in the latest list from `targets$`, each
 * into its own container.
 *
 * Every user gets their own `renderStream()`, started when they enter the list
 * and finished (cleared) when they leave it, so one slow or failing attach never
 * holds up anyone else's. Like `renderStream()`, it never errors.
 */
export function renderEach(
  targets$: Observable<readonly number[]>,
  options: RenderEachOptions,
): Observable<void> {
  return defer(() => {
    // Replays the current list to each user's render as it starts.
    const latest$ = targets$.pipe(share({ connector: () => new ReplaySubject(1) }));
    const rendering = new Set<number>();

    return latest$.pipe(
      mergeMap((ids) => {
        for (const id of rendering) if (!ids.includes(id)) rendering.delete(id);
        const added = ids.filter((id) => !rendering.has(id));
        added.forEach((id) => rendering.add(id));

        return merge(
          ...added.map((id) =>
            renderStream(
              latest$.pipe(
                map((now) => (now.includes(id) ? id : null)),
                // Ends this user's render once they drop out, after clearing them.
                takeWhile((target) => target !== null, true),
              ),
              { ...options, container: () => options.container(id) },
            ),
          ),
        );
      }),
    );
  });
}
