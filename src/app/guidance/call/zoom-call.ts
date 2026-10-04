import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import type ZoomVideo from '@zoom/videosdk';
import type { VideoPlayer } from '@zoom/videosdk';
import { EMPTY, Observable, merge, switchMap } from 'rxjs';
import { CallService, CallViews, JoinOptions, RemoteParticipant } from './call.service';
import { renderEach, renderStream } from './zoom-renderer';
import {
  ZoomEvent,
  ZoomUserSnapshot,
  initialZoomSessionState,
  reduce,
  selectConnectionTarget,
  selectRemoteParticipants,
  selectRemoteShareTarget,
  selectRemoteSharer,
  selectRemoteVideoTargets,
  selectSelfVideoTarget,
} from './zoom-session.state';
import { ZoomTokenError, ZoomTokens } from './zoom-tokens';

type ZoomClient = ReturnType<typeof ZoomVideo.createClient>;
type ZoomStream = ReturnType<ZoomClient['getMediaStream']>;
type ZoomUser = ReturnType<ZoomClient['getAllUser']>[number];

/** `VideoQuality.Video_720P`, as a plain value so the SDK can stay lazily loaded. */
const VIDEO_720P = 3;

/**
 * A real call over the Zoom Video SDK, open to any number of people. Everyone
 * joins the Zoom session (`room`) that belongs to the session; the
 * provider joins as host. The room page provides one per visit.
 *
 * ## How it fits together
 *
 * 1. **Intake.** Every Zoom callback and every user action becomes one
 *    `ZoomEvent` and goes through `dispatch()`. That's the only way state changes.
 * 2. **State.** `dispatch()` runs the pure `reduce()` (zoom-session.state.ts)
 *    over a single `state` signal.
 * 3. **Derivation.** The public signals the stage reads (`status`, `remotes`, …) and
 *    the *render targets* (whose streams belong in which containers) are
 *    `computed()` from that state.
 * 4. **Rendering.** Each render target is converted with `toObservable()` and fed
 *    to `renderStream()` (zoom-renderer.ts). Its `switchMap` attaches and detaches
 *    Zoom's `<video-player>`s so the DOM matches the target, cancelling stale
 *    attaches along the way.
 * 5. **Connecting.** The call we want to be in is state too (`request`), and it
 *    runs the same way: `switchMap` over `selectConnectionTarget` runs `connect()`,
 *    and leaving, a newer join, or closing the room cancels it. A cancelled join
 *    that lands late hangs up after itself, just as a late attach detaches itself.
 *
 * This class does only the I/O: calling the SDK, turning its callbacks into
 * events, and supplying the attach/detach operations. It never decides what
 * should be on screen.
 */
@Injectable()
export class ZoomCall extends CallService {
  private readonly tokens = inject(ZoomTokens);
  private readonly destroyRef = inject(DestroyRef);
  private destroyed = false;

  // ---- State ---------------------------------------------------------------

  /** The whole session. Changed only by `dispatch()`. */
  private readonly state = signal(initialZoomSessionState);

  readonly status = computed(() => this.state().status);
  readonly micOn = computed(() => this.state().micOn);
  readonly cameraOn = computed(() => this.state().cameraOn);
  readonly sharing = computed(() => this.state().sharing);
  readonly reconnecting = computed(() => this.state().reconnecting);
  readonly error = computed(() => this.state().error);
  readonly remotes = computed(() => selectRemoteParticipants(this.state()), {
    equal: sameRemotes,
  });
  readonly remoteSharer = computed(() => {
    const sharer = selectRemoteSharer(this.state());
    return sharer ? (this.remotes().find((p) => p.userId === sharer.userId) ?? null) : null;
  });
  // ---- SDK handles -----------------------------------------------------------

  private client?: ZoomClient;
  /** Exists from a successful join until we leave; media calls need it. */
  private stream?: ZoomStream;
  /** Containers from the stage; a signal so renders can wait for them. */
  private readonly views = signal<CallViews | undefined>(undefined);
  /** This tab's `user_key`, so other people can recognise stale copies of us. */
  private readonly key = tabKey();
  /** Media actions in flight, so a double-click doesn't start something twice. */
  private readonly busy = new Set<string>();

  constructor() {
    super();
    this.destroyRef.onDestroy(() => (this.destroyed = true));
    this.startConnecting();
    this.startRendering();
  }

  // ---- CallService ---------------------------------------------------------

  setViews(views: CallViews): void {
    this.views.set(views);
  }

  async join(request: JoinOptions): Promise<void> {
    const status = this.status();
    if (status === 'connecting' || status === 'connected') return;
    this.dispatch({ type: 'join-requested', request });
  }

  async leave(): Promise<void> {
    this.dispatch({ type: 'leave-requested' });
  }

  toggleMic(): Promise<void> {
    return this.once('mic', async () => {
      if (!this.stream) return;
      if (this.micOn()) await this.stream.muteAudio();
      else await this.stream.unmuteAudio();
      this.dispatch({ type: 'local-mic', on: !this.micOn() });
    });
  }

  /** Starts or stops our camera. The self-view follows from state; nothing is attached here. */
  toggleCamera(): Promise<void> {
    return this.once('camera', async () => {
      if (!this.stream) return;
      if (this.cameraOn()) {
        await this.stream.stopVideo();
        this.dispatch({ type: 'local-camera', on: false });
        return;
      }
      try {
        // Zoom mirrors the self-view itself; CSS transforms near its players are best avoided.
        await this.stream.startVideo({ mirrored: true });
        this.dispatch({ type: 'local-camera', on: true });
      } catch {
        this.dispatch({
          type: 'error',
          message:
            'Camera is blocked. Allow camera access in your browser settings, then turn it on again.',
        });
      }
    });
  }

  /**
   * Starts or stops sharing our screen. Unlike the other streams, our own share
   * preview isn't attached after the fact: the SDK draws it into an element we
   * hand to `startShareScreen()`, so that element is managed here.
   */
  toggleShare(): Promise<void> {
    return this.once('share', async () => {
      const share = this.views()?.share;
      if (!this.stream || !share) return;

      if (this.sharing()) {
        await this.stream.stopShareScreen();
        this.clearSharePreview();
        this.dispatch({ type: 'local-share', on: false });
        return;
      }
      const sharer = this.remoteSharer();
      if (sharer) {
        const name = sharer.name || 'Someone else';
        this.dispatch({
          type: 'error',
          message: `${name} is sharing. Only one screen can be shared at a time.`,
        });
        return;
      }

      const preview = this.stream.isStartShareScreenWithVideoElement()
        ? document.createElement('video')
        : document.createElement('canvas');
      preview.dataset['sharePreview'] = '';
      share.append(preview);
      try {
        await this.stream.startShareScreen(preview);
        this.dispatch({ type: 'local-share', on: true });
      } catch (err) {
        preview.remove();
        // Closing the browser's picker isn't worth reporting.
        if (!/cancel|denied|permission/i.test(reasonOf(err))) {
          this.dispatch({
            type: 'error',
            message: 'Screen sharing isn’t available in this browser.',
          });
        }
      }
    });
  }

  // ---- Intake: the only way state changes -------------------------------------

  private dispatch(event: ZoomEvent): void {
    this.state.update((state) => reduce(state, event));
  }

  /** The current participant list in our own shape. */
  private snapshot(): ZoomUserSnapshot[] {
    return (this.client?.getAllUser() ?? []).map(toSnapshot);
  }

  /**
   * Gets the shared client on first join and turns each SDK callback into a
   * `ZoomEvent`, until this room closes.
   */
  private async ensureClient(): Promise<ZoomClient> {
    if (this.client) return this.client;
    const client = await loadZoomClient();
    if (this.destroyed) throw new Error('the room was closed');

    // The client outlives this room, so everything hooked onto it comes off again.
    const unhook: (() => void)[] = [];
    this.destroyRef.onDestroy(() => unhook.forEach((undo) => undo()));

    // Zoom's `leaveOnPageUnload` relies on the `unload` event, which Chrome now
    // blocks. Without a clean leave, a reload or closed tab lingers as a stale copy
    // of that person, so leave on `pagehide` instead.
    const leaveOnHide = () => {
      if (this.stream) client.leave();
    };
    window.addEventListener('pagehide', leaveOnHide);
    unhook.push(() => window.removeEventListener('pagehide', leaveOnHide));

    // The app is zoneless and these handlers only dispatch, so no zone work is needed.
    const on = (event: string, handler: (payload: any) => void) => {
      client.on(event, handler);
      unhook.push(() => client.off(event, handler));
    };

    // Who is here. Payloads are deltas, so re-read the whole list each time.
    for (const event of ['user-added', 'user-updated', 'user-removed']) {
      on(event, () => this.dispatch({ type: 'participants', users: this.snapshot() }));
    }

    on(
      'peer-video-state-change',
      ({ action, userId }: { action: 'Start' | 'Stop'; userId: number }) =>
        this.dispatch({ type: 'peer-video', userId, on: action === 'Start' }),
    );

    on(
      'active-share-change',
      ({ state, userId }: { state: 'Active' | 'Inactive'; userId: number }) => {
        // Our own share is tracked through `local-share`.
        if (userId === client.getCurrentUserInfo()?.userId) return;
        this.dispatch({ type: 'peer-share', userId, on: state === 'Active' });
      },
    );

    // Sharing stopped from the browser's own "Stop sharing" bar.
    on('passively-stop-share', () => {
      this.clearSharePreview();
      this.dispatch({ type: 'local-share', on: false });
    });

    on(
      'connection-change',
      ({ state }: { state: 'Connected' | 'Reconnecting' | 'Closed' | 'Fail' }) => {
        if (state === 'Closed' || state === 'Fail') this.stream = undefined;
        this.dispatch({ type: 'connection', state });
        // Events may have been missed while reconnecting, so trust a fresh list fully.
        if (state === 'Connected') {
          this.dispatch({ type: 'participants', users: this.snapshot(), authoritative: true });
        }
      },
    );

    // Media broke mid-call: device unplugged, permission revoked, audio interrupted.
    on('active-media-failed', ({ type }: { type: 'audio' | 'video' | 'sharing' }) => {
      if (type === 'sharing') this.clearSharePreview();
      this.dispatch({ type: 'media-failed', kind: type });
    });

    this.client = client;
    return client;
  }

  private async startAudio(): Promise<void> {
    try {
      await this.stream!.startAudio({ mute: !this.micOn() });
    } catch {
      this.dispatch({ type: 'local-mic', on: false });
      this.dispatch({
        type: 'error',
        message:
          'Microphone is blocked. Allow microphone access in your browser settings, then unmute.',
      });
    }
  }

  // ---- Connecting --------------------------------------------------------------

  /**
   * Keeps us connected to the call state asks for, for the life of this service.
   * Like rendering, a new target cancels the work in flight: leaving (target null)
   * or closing the room (destroy) tears down `connect()`, which hangs up.
   */
  private startConnecting(): void {
    toObservable(computed(() => selectConnectionTarget(this.state())))
      .pipe(
        switchMap((request) => (request ? this.connect(request) : EMPTY)),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  /**
   * Joins `request` and stays in it until unsubscribed, then hangs up. If it's
   * unsubscribed while still joining, the join is abandoned: one that lands late
   * hangs straight back up, so nobody is left in the call (with a live
   * microphone) without knowing it.
   */
  private connect({ room, displayName, isHost }: JoinOptions): Observable<never> {
    return new Observable<never>(() => {
      let cancelled = false;
      let joined: ZoomClient | undefined;

      (async () => {
        const client = await this.ensureClient();
        const token = await this.tokens.get(room, isHost ? 'host' : 'participant', this.key);
        // A room that was just closed may still be hanging up on the shared client.
        await pendingLeave;
        if (cancelled) return;
        // Zoom announces people already in the session while this is still running.
        // Those events land in state like any other; nothing renders until `joined`.
        await client.join(room, token, displayName);
        if (cancelled) return void hangUp(client);
        joined = client;
        this.stream = client.getMediaStream();

        this.dispatch({
          type: 'joined',
          myId: client.getCurrentUserInfo().userId,
          myKey: this.key,
          maxRemoteVideos: this.stream.getMaxRenderableVideos(),
          users: this.snapshot(),
        });
        await this.startAudio();
      })().catch((err) => {
        if (!cancelled) this.dispatch({ type: 'join-failed', message: describeJoinError(err) });
      });

      return () => {
        cancelled = true;
        if (!joined) return;
        // `leave-requested` has already cleared the screen; tell state once it's done.
        hangUp(joined).finally(() => {
          this.stream = undefined;
          this.dispatch({ type: 'left' });
        });
      };
    });
  }

  // ---- Rendering ---------------------------------------------------------------

  /**
   * Wires each render target to its container, for the life of this service.
   * `toObservable()` emits a target whenever it changes, and `renderStream()` /
   * `renderEach()` make the DOM match (see zoom-renderer.ts).
   */
  private startRendering(): void {
    const target = (select: typeof selectSelfVideoTarget) =>
      toObservable(computed(() => (this.views() ? select(this.state()) : null)));
    const gallery = toObservable(
      computed(() => (this.views() ? selectRemoteVideoTargets(this.state()) : []), {
        equal: sameIds,
      }),
    );

    const video = {
      attach: (userId: number) => this.requireStream().attachVideo(userId, VIDEO_720P),
      detach: (userId: number, el: HTMLElement) =>
        this.stream ? this.stream.detachVideo(userId, el as VideoPlayer) : Promise.resolve(),
    };
    const share = {
      attach: (userId: number) => this.requireStream().attachShareView(userId),
      detach: (userId: number, el: HTMLElement) =>
        this.stream ? this.stream.detachShareView(userId, el as VideoPlayer) : Promise.resolve(),
    };

    merge(
      renderEach(gallery, {
        name: 'remote video',
        container: (userId) => this.views()?.remote(userId),
        ops: video,
      }),
      renderStream(target(selectSelfVideoTarget), {
        name: 'self view',
        container: () => this.views()?.self,
        ops: video,
      }),
      renderStream(target(selectRemoteShareTarget), {
        name: 'shared screen',
        container: () => this.views()?.share,
        ops: share,
      }),
    )
      .pipe(takeUntilDestroyed())
      .subscribe();
  }

  private requireStream(): ZoomStream {
    if (!this.stream) throw new Error('not in a session');
    return this.stream;
  }

  private clearSharePreview(): void {
    this.views()?.share.querySelector('[data-share-preview]')?.remove();
  }

  /** Runs `action` unless the same kind of action is already running. */
  private async once(key: string, action: () => Promise<void>): Promise<void> {
    if (this.busy.has(key)) return;
    this.busy.add(key);
    try {
      await action();
    } finally {
      this.busy.delete(key);
    }
  }
}

/**
 * Zoom's client is one per page (`createClient()` always returns the same one),
 * so it's loaded and initialised once, however many rooms are opened.
 */
let zoomClient: Promise<ZoomClient> | undefined;

function loadZoomClient(): Promise<ZoomClient> {
  zoomClient ??= (async () => {
    // Loaded on first join, so the SDK (~1 MB) stays out of the initial bundle.
    const { default: Zoom } = await import('@zoom/videosdk');
    const client = Zoom.createClient();
    // `enforceMultipleVideos` lets browsers without SharedArrayBuffer show more
    // than one camera; `getMaxRenderableVideos()` then says how many.
    await client.init('en-US', 'Global', { patchJsMedia: true, enforceMultipleVideos: true });
    return client;
  })().catch((err) => {
    zoomClient = undefined; // let the next join try again
    throw err;
  });
  return zoomClient;
}

/** The last hang-up on the shared client, so the next room's join can wait for it. */
let pendingLeave: Promise<unknown> = Promise.resolve();

function hangUp(client: ZoomClient): Promise<unknown> {
  pendingLeave = Promise.resolve(client.leave()).catch(() => undefined);
  return pendingLeave;
}

/**
 * This tab's `user_key`. It survives a reload, so the copy a reload leaves behind
 * is recognised as the same person, while every other tab gets its own. It's only
 * written to sessionStorage as the page goes away, because duplicating a tab
 * copies sessionStorage and the copy must not pass as this tab.
 */
let savedTabKey: string | undefined;

function tabKey(): string {
  return (savedTabKey ??= loadTabKey());
}

function loadTabKey(): string {
  const name = 'zoom-user-key';
  let storage: Storage | undefined;
  try {
    storage = sessionStorage;
  } catch {
    // Storage is blocked: still unique, just not kept across reloads.
  }
  const key = storage?.getItem(name) || crypto.randomUUID();
  const forget = () => storage?.removeItem(name);
  forget();
  window.addEventListener('pagehide', () => storage?.setItem(name, key));
  window.addEventListener('pageshow', forget); // back from the back/forward cache
  return key;
}

function sameIds(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

function sameRemotes(a: RemoteParticipant[], b: RemoteParticipant[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (p, i) =>
        p.userId === b[i].userId &&
        p.name === b[i].name &&
        p.videoOn === b[i].videoOn &&
        p.muted === b[i].muted,
    )
  );
}

function toSnapshot(user: ZoomUser): ZoomUserSnapshot {
  return {
    userId: user.userId,
    displayName: user.displayName,
    userKey: user.userKey ?? user.userIdentity,
    bVideoOn: user.bVideoOn,
    sharerOn: user.sharerOn,
    muted: user.muted,
    isInFailover: user.isInFailover,
  };
}

function reasonOf(err: unknown): string {
  if (err && typeof err === 'object' && 'reason' in err) return String(err.reason);
  return err instanceof Error ? err.message : String(err ?? '');
}

/** Turns Zoom's join failures into something anyone in the room can act on. */
function describeJoinError(err: unknown): string {
  if (err instanceof ZoomTokenError) return err.message;
  const reason = reasonOf(err);
  if (/signature|apiKey|sdkKey|token/i.test(reason)) {
    return 'Couldn’t join: the Zoom credentials were rejected. Check the SDK key and secret.';
  }
  if (/network|timeout|websocket/i.test(reason)) {
    return 'Couldn’t reach Zoom. Check your internet connection, then try again.';
  }
  return `Couldn’t join the session${reason ? ` (${reason})` : ''}. Try again.`;
}
